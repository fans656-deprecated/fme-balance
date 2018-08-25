import re
import itertools


RE_ITEM = re.compile(
    '(?P<amount>[-+]?\d+(\.\d+)?) ?(?P<desc>[^{}]+)? ?(\{(?P<tags>.+)\})?')


class Balance(object):

    @staticmethod
    def from_raw(text):
        return from_raw(text)

    def __init__(self, items):
        self.items = items
        self.days = group_by_day(items)


def from_raw(text):
    lines = text.split('\n')
    items = []
    date = None
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if re.match('^\d\d\d\d-\d\d-\d\d$', line):
            date = line
        else:
            item = parse_item(line)
            if item:
                item.update({'date': date})
            items.append(item)
    return Balance(items)


def parse_item(line):
    try:
        m = re.match(RE_ITEM, line)
        amount = m.group('amount')
        desc = m.group('desc')
        tags = m.group('tags')
        tags = tags.split(':') if tags else []
        return {
            'amount': float(amount),
            'desc': desc,
            'tags': tags,
        }
    except Exception:
        return None


def group_by_day(items):
    return [{
        'date': date,
        'items': list(g),
    } for date, g in itertools.groupby(items, lambda item: item['date'])]


if __name__ == '__main__':
    from t import text
    import dbutil

    b = Balance.from_raw(text)
    for item in b.items:
        dbutil.add_item(item)
    #for day in b.days:
    #    print day
