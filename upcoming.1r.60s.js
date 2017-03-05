#! /usr/bin/env node

var https = require('https');
var icalendar = require('icalendar')

var url = 'https://calendar.google.com/calendar/ical/account%40gmail.com/private-hash/basic.ics'

var filterFutureEvents = function(events) {
    var now = new Date();
    var result = [];
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var dateStart = event.getPropertyValue('DTSTART');
        if (dateStart >= now) {
            result.push(event);
        }
    }
    return result;
}

var sortEvents = function(events) {
    events.sort(function (first, second) {
        var firstDate = first.getPropertyValue('DTSTART');
        var secondDate = second.getPropertyValue('DTSTART');
        return firstDate - secondDate;
    });
    return events;
}

var filterFirstEvents = function(count, events) {
    return events.splice(0, count);
}

var divideToDays = function(events) {
    result = {}
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var d = event.getPropertyValue('DTSTART');
        var key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        if (!result[key]) result[key] = [];
        result[key].push(event);
    }
    return result;
}

var parse = function(data) {
    var cal = icalendar.parse_calendar(data);
    events = cal.events();
    return events;
};

var formatTime = function(date) {
    return date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
}

var duration =  function(start, end) {
    var ms = end - start;
    var days = Math.floor(ms / 1000 / 60 / 60 / 24);
    if (days <= 1) return '';
    return '(' + days + ' days)';
}

var untilStart = function(eventsDict) {
    var now = new Date();
    for (var key in eventsDict) {
        var events = eventsDict[key];
        var firstEvent = events[0];
        var dt = firstEvent.getPropertyValue('DTSTART');
        var ms = dt - now;

        var days = Math.floor(ms / 1000 / 60 / 60 / 24);
        if (days > 0) return '(' + days + 'd)';

        var hours = Math.floor(ms / 1000 / 60 / 60);
        if (hours > 0) return '(' + hours + 'h)';

        var minutes = Math.floor(ms / 1000 / 60);
        if (minutes > 0) return '(' + minutes + 'm)';

        return '';
    }
    return '';
}

var printResult = function(eventsDict) {
    console.log(untilStart(eventsDict), '| iconName=x-office-calendar-symbolic');
    console.log('---');
    for (var key in eventsDict) {
        console.log(new Date(key).toDateString() + ' | iconName=x-office-calendar-symbolic');
        var events = eventsDict[key];
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            var d = event.getPropertyValue('DTSTART');
            var end = event.getPropertyValue('DTEND');
            var summary = event.getPropertyValue('SUMMARY');
            if (d.date_only) {
                console.log('  ', summary, duration(d, end));
            } else {
                console.log('  ', formatTime(d), '-', formatTime(end), summary);
            }
            
        }
    }
}

var process = function(data) {
    var events = parse(data);
    var future = filterFutureEvents(events);
    var sorted = sortEvents(future);
    var first = filterFirstEvents(10, sorted);
    var divided = divideToDays(first)
    printResult(divided);   
}

https.get(url, function(response) {
    var data = '';
    response.on('data', function(chunk) {
        data += chunk;
    });

    response.on('end', function() {
        process(data);
    });
})
