const axios = require('axios');

const clientId = '3MVG9PwZx9R6_UrdtUSIZPYSy9q_8mdveDlmiaFy20mzfv2HIPfyHcZD8VQPp9LBnywDeLTMHuV_8f.C0_7T2';
const clientSecret = '74FAA50B25220C4C17F00135B53CF89ECCC94AFEF6B274372D471BF835C55A07';
const username = 'kawtar@university.com';
const password = 'salma2001@' + 'rPIRXEViB6HyQ3UI6WV9HQnL'; // Password + Security Token
const authUrl = 'https://login.salesforce.com/services/oauth2/token';

async function getAuthToken() {
    try {
        const response = await axios.post(authUrl, new URLSearchParams({
            'grant_type': 'password',
            'client_id': clientId,
            'client_secret': clientSecret,
            'username': username,
            'password': password
        }));

        return response.data.access_token;
    } catch (error) {
        console.error('Error obtaining Salesforce auth token:', error);
        throw error;
    }
}

async function createSalesforceProduct(product) {
    const token = await getAuthToken();
    const instanceUrl = 'https://university-f0-dev-ed.develop.my.salesforce.com';
    const url = `${instanceUrl}/services/apexrest/produit/`;

    try {
        const response = await axios.post(url, product, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error creating product in Salesforce:', error);
        throw error;
    }
}

async function removeSalesforceProduct(productId) {
    const token = await getAuthToken();
    const instanceUrl = 'https://university-f0-dev-ed.develop.my.salesforce.com';
    const url = `${instanceUrl}/services/apexrest/produit/${productId}`; // Adjust the URL according to your Salesforce API

    try {
        const response = await axios.delete(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error removing product from Salesforce:', error);
        throw error;
    }
}

module.exports = {
    createSalesforceProduct,
    removeSalesforceProduct
};

