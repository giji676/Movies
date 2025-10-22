def is_informational(code):
    return 1000 <= code <= 1999

def is_success(code):
    return 2000 <= code <= 2999

def is_redirect(code):
    return 3000 <= code <= 3999

def is_client_error(code):
    return 4000 <= code <= 4999

def is_server_error(code):
    return 5000 <= code <= 5999

WS_4001_UNAUTHORISED = 4001
WS_4003_FORBIDDEN = 4003
