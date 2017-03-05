#! /usr/bin/env python2

import imaplib

toCheck = {
    "AccountName": {
        "server": "imap.server.com",
        "username": "name.surname@server.com",
        "password": "123456789"
    },
    "SecondAccounr": {
        "server": "imap.server2.com",
        "username": "name.surname2@server.com",
        "password": "123456789"
    },
}


def check(server, username, password):
    mail = imaplib.IMAP4_SSL(server)
    mail.login(username, password)
    mail.select("inbox")
    result, data = mail.search(None, "UNSEEN")
    if result == "OK":
        return len(data[0].split())
    else:
        return 0


mails = [(name, check(p["server"], p["username"], p["password"]))
         for name, p in toCheck.iteritems()]

total = sum(map(lambda i: i[1], mails))

if total == 0:
    print " | iconName=mail-read-symbolic"
else:
    print "(%d) | iconName=mail-unread-symbolic" % total

print "---"

for i in mails:
    print "%s: %d new mails | bash=thunderbird terminal=false" % (i[0], i[1])
