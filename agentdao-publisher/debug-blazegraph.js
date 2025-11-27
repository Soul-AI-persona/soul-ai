
import axios from 'axios';

const SPARQL_ENDPOINT = 'http://localhost:9999/blazegraph/namespace/kb/sparql';
const UAL = 'did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/404759';

async function checkBlazegraph() {
    console.log(`Checking Blazegraph for UAL: ${UAL}`);
    
    // Query to find any triples where the subject is the UAL or related to it
    const query = `
        SELECT ?s ?p ?o 
        WHERE { 
            ?s ?p ?o .
            FILTER (CONTAINS(STR(?s), "${UAL}") || CONTAINS(STR(?o), "${UAL}"))
        } 
        LIMIT 10
    `;

    try {
        const response = await axios.get(SPARQL_ENDPOINT, {
            params: {
                query: query,
                format: 'json'
            }
        });

        console.log('SPARQL Query Result:', JSON.stringify(response.data, null, 2));
        
        if (response.data.results.bindings.length > 0) {
            console.log("✅ Data FOUND in Blazegraph!");
        } else {
            console.log("❌ Data NOT FOUND in Blazegraph.");
        }

    } catch (error) {
        console.error('Error querying Blazegraph:', error.message);
    }
}

checkBlazegraph();
