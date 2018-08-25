import pymongo


def getdb(g={}):
    if 'db' not in g:
        g['db'] = pymongo.MongoClient().balance
    return g['db']


if __name__ == '__main__':
    #getdb().balance.remove({})
    r = getdb().balance.find({}).sort('date', 1)
    print list(r)
