import json
import functools
import traceback

import jwt
from flask import request

import conf
from errors import Error, InternalError


def guarded(viewfunc):
    @functools.wraps(viewfunc)
    def wrapped(*args, **kwargs):
        try:
            resp = viewfunc(*args, **kwargs)
            if not resp:
                return ''
            elif isinstance(resp, dict):
                return json.dumps(resp)
            else:
                return resp
        except Error as e:
            return e.resp
        except Exception:
            traceback.print_exc()
            return InternalError().resp
    return wrapped


def require_me_login(viewfunc):
    @functools.wraps(viewfunc)
    def wrapped(*args, **kwargs):
        try:
            token = request.cookies.get('token')
            user = jwt.decode(token, conf.pubkey, algorithm='RS512')
            assert user['username'] == 'fans656'
        except Exception:
            return 'Unauthorized', 401
        return viewfunc(*args, **kwargs)
    return wrapped


def get_int_arg(name, default=None):
    s = request.args.get(name)
    return to_int(s, 0 if default is None else default)


def to_int(s, default=0):
    try:
        return int(s)
    except Exception:
        return default
