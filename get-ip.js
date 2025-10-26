const os = require('os');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // 跳過內部地址和非 IPv4 地址
            if (interface.family === 'IPv4' && !interface.internal) {
                addresses.push({
                    name: name,
                    address: interface.address
                });
            }
        }
    }
    
    return addresses;
}

const localIPs = getLocalIP();
console.log('🌐 您的本機 IP 地址：');
localIPs.forEach(ip => {
    console.log(`   ${ip.name}: ${ip.address}`);
});

if (localIPs.length > 0) {
    console.log('\n📱 外部訪問地址：');
    localIPs.forEach(ip => {
        console.log(`   http://${ip.address}:4000`);
    });
} else {
    console.log('\n❌ 未找到可用的網絡接口');
}

console.log('\n💡 提示：');
console.log('   - 確保防火牆允許 4000 端口的訪問');
console.log('   - 如果在路由器後面，需要設置端口轉發');
console.log('   - 使用 "npm start" 啟動服務器'); 