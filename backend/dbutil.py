import db


def add_item(item):
    r = db.getdb().balance.insert_one(item)
    return r.acknowledged


def get_items(date=None, count=None):
    query = {}

    if date:
        query['date'] = date

    r = db.getdb().balance.find(query, {'_id': False})
    r.sort([('date', -1), ('ctime', 1)])

    if count:
        count = to_int(count)
        if count:
            r.limit(count)

    return list(r)


def clear_all():
    db.getdb().balance.remove({})
