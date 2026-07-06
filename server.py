import http.server
import socketserver
import functools
import os

DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 5050

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIR)
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving %s on %d" % (DIR, PORT))
    httpd.serve_forever()
