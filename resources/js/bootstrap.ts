import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const token = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

declare global {
    interface Window {
        axios: typeof axios;
    }
}

window.axios = axios;

export default axios;
