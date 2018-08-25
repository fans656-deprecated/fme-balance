from flask import request

import utils
import dbutil
from errors import Error
from balance import Balance


@utils.require_me_login
def post_item():
    data = request.json
    dbutil.add_item({
        'amount': data['amount'],
        'desc': data['desc'],
        'tags': data['tags'],
        'date': data['date'],
        'ctime': data.get('ctime'),
    })


@utils.require_me_login
def get_items():
    date = request.args.get('date')
    count = request.args.get('count')
    items = dbutil.get_items(
        date=date,
        count=count,
    )
    return {
        'items': items,
    }


@utils.require_me_login
def get_days():
    offset = utils.get_int_arg('offset', 0)
    count = utils.get_int_arg('count')

    items = dbutil.get_items()
    balance = Balance(items)
    if offset or count:
        days = balance.days[offset:offset + count]
    else:
        days = balance.days
    return {
        'days': days,
    }


@utils.require_me_login
def get_raw():
    items = dbutil.get_items()
    return {
        'items': items,
    }


@utils.require_me_login
def put_raw():
    text = request.data
    balance = Balance.from_raw(text)
    dbutil.clear_all()
    for item in balance.items:
        dbutil.add_item(item)


endpoints = [
    ('POST', '/api/item', post_item),
    ('GET', '/api/items', get_items),
    ('GET', '/api/days', get_days),
    ('PUT', '/api/raw', put_raw),
]
