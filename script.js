// script.js

function getUserIP(onNewIP) {
    // Проверяем, поддерживает ли браузер RTCPeerConnection
    var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
    if (!RTCPeerConnection) {
        return; // WebRTC не поддерживается, ничего не делаем
    }

    var pc = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" }
        ]
    });

    // Используем Set для хранения уникальных IP-адресов
    var uniqueIPs = new Set();

    function handleCandidate(candidate) {
        var ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9:]{1,4}(:[a-f0-9:]{1,4}){7})/g;
        var ips = candidate.match(ipRegex);
        if (ips) {
            ips.forEach(ip => {
                // Фильтруем локальные IP-адреса, дублирующиеся IP и адрес 0.0.0.0
                if (!ip.startsWith('127.') && !ip.startsWith('10.') &&
                    !ip.startsWith('172.') && !ip.startsWith('192.168.') &&
                    !ip.startsWith('169.254.') && ip !== '0.0.0.0') {
                    if (!uniqueIPs.has(ip)) {
                        uniqueIPs.add(ip);
                        onNewIP(ip);
                    }
                }
            });
        }
    }

    pc.createDataChannel("");

    pc.onicecandidate = function(event) {
        if (event.candidate) {
            handleCandidate(event.candidate.candidate);
        }
    };

    pc.createOffer().then(function(offer) {
        return pc.setLocalDescription(offer);
    }).catch(function(error) {
        // Ошибки можно обработать, если нужно
    });

    // Ожидание дополнительных кандидатов ICE
    setTimeout(() => {
        pc.getStats(null).then(stats => {
            stats.forEach(report => {
                if (report.type === 'local-candidate') {
                    let candidate = `candidate:${report.id} 1 ${report.protocol.toUpperCase()} ${report.priority} ${report.address} ${report.port} typ ${report.candidateType}`;
                    handleCandidate(candidate);
                }
            });
        });
    }, 10000); // Ждем 10 секунд для сбора всех кандидатов
}

document.addEventListener('DOMContentLoaded', function() {
    var ul = document.getElementById('ip-addresses');

    getUserIP(function(ip) {
        var li = document.createElement('li');
        li.textContent = ip;
        ul.appendChild(li);
    });
});
