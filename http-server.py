import http.server
import sys

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        super().end_headers()
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.send_header('Access-Control-Allow-Headers', '*')

if __name__ == '__main__':
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])

    httpd = http.server.HTTPServer(("", port), CORSRequestHandler)
    print("LEEDZ.COM STARTED ON PORT ", port)
    httpd.serve_forever()