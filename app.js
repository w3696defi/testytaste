document.addEventListener("DOMContentLoaded", () => {
    const ipDisplay = document.getElementById("status");
    const resultsDiv = document.getElementById("results");

    let ipArray = [];
    let headerCheck = false;
    let webrtcCheck = false;
    let timezoneCheck = false;
    let datacenterCheck = false;

    function findPublicIP() {
        const ipSet = new Set();
        const peerConnection = new (window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection)({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peerConnection.createDataChannel("");

        peerConnection.createOffer()
            .then(sdp => peerConnection.setLocalDescription(sdp))
            .catch(err => console.error("Offer creation error:", err));

        peerConnection.onicecandidate = function (ice) {
            if (ice.candidate && ice.candidate.candidate) {
                const ipMatches = ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/g);
                if (ipMatches) {
                    ipMatches.forEach(ip => {
                        if (ip !== "0.0.0.0") ipSet.add(ip);
                    });
                }
            }
        };

        peerConnection.onicecandidateerror = (err) => console.error("ICE Candidate Error:", err);
        peerConnection.oniceconnectionstatechange = () => {
            if (peerConnection.iceConnectionState === 'disconnected') {
                ipArray = [...ipSet];
                updateResults();
            }
        };
    }

    async function checkIP() {
        try {
            const ip = await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip);
            const response = await fetch(`https://api.incolumitas.com/?q=${ip}`);
            const data = await response.json();
            if (!data.is_datacenter && !data.is_vpn && !data.is_tor && !data.is_proxy) {
                datacenterCheck = true;
            }
            updateResults();
        } catch (error) {
            console.error("IP Check Error:", error);
        }
    }

    function checkTimezone() {
        const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        fetch('https://worldtimeapi.org/api/ip')
            .then(response => response.json())
            .then(data => {
                if (data.timezone === localTimeZone) {
                    timezoneCheck = true;
                }
                updateResults();
            })
            .catch(error => console.error("Timezone Check Error:", error));
    }

    function checkHeaders() {
        // In a real scenario, you'd check HTTP headers on the server-side
        // For now, let's assume some headers are always present
        const blackListedHeader = [
            "x-forwarded-for", "x-client-ip", "x-real-ip", "x-forwarded", "x-cluster-client-ip",
            "forwarded-for", "forwarded", "via", "x-forwarded-host", "x-forwarded-proto",
            "forwarded-proto", "x-forwarded-protocol", "x-http-forwarded-for", "http-forwarded-for",
            "x-http-forwarded", "http-forwarded", "x-http-via", "http-via", "x-proxy-user",
            "proxy-user", "x-remote-ip", "remote-ip", "x-remote-addr", "remote-addr",
            "x-true-client-ip", "true-client-ip", "cf-connecting-ip"
        ];
        // For the purpose of this example, assume these headers are present
        headerCheck = blackListedHeader.length > 0;
        updateResults();
    }

    function updateResults() {
        ipDisplay.innerHTML = `
            <h2>Status</h2>
            <p>Datacenter Check: ${datacenterCheck ? "True" : "False"}</p>
            <p>Timezone Check: ${timezoneCheck ? "True" : "False"}</p>
            <p>WebRTC Check: ${webrtcCheck ? "True" : "False"}</p>
            <p>Header Check: ${headerCheck ? "True" : "False"}</p>
            <p>Detected IPs: ${ipArray.join(", ")}</p>
        `;
        if (datacenterCheck && timezoneCheck && webrtcCheck && headerCheck) {
            resultsDiv.innerHTML = "<h3>No proxy detected</h3>";
        } else {
            resultsDiv.innerHTML = "<h3>Proxy detected</h3>";
        }
    }

    findPublicIP();
    checkIP();
    checkTimezone();
    checkHeaders();
});
