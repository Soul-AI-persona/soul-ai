
import axios from 'axios';

async function checkNode() {
    try {
        const response = await axios.get('http://localhost:8900/info');
        console.log('✅ Node is reachable!');
        console.log('Node Info:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Node is NOT reachable:', error.message);
    }
}

checkNode();
