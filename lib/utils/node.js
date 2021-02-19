exports.url = require('url');
exports.cookie = require('cookie');

const querystring = require('querystring');
exports.querystring = querystring;

const crypto = require('crypto');
exports.md5 = function (data) {
    return crypto.createHash('md5').update(data).digest('hex');
};

const axios = require('axios');
axios.defaults.timeout = 5000;
axios.defaults.proxy = {
    host: '127.0.0.1',
    port: '8899',
};
axios.defaults.transformResponse;
axios.interceptors.request.use(
    (config) => {
        console.debug('1');
        return config;
    },
    (error) => {
        console.debug('2');
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

exports.axios = axios;

const mime = require('./mime.js');
exports.mime = {
    get: (path) => mime[path.slice(path.lastIndexOf('.') + 1)] || 'application/vnd.op-unknown',
};

const NUM_CHARS = {};
'0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split('').forEach((v, i) => {
    NUM_CHARS[i] = v;
    NUM_CHARS[v] = i;
});

exports.NumberUtil = {
    parse62: (s) => {
        let num = 0,
            base = 1;
        s.split('')
            .reverse()
            .forEach((c) => {
                num += NUM_CHARS[c] * base;
                base *= 62;
            });
        return num;
    },
    to62: (n) => {
        const arr = [];
        while (n > 0) {
            arr.push(NUM_CHARS[n % 62]);
            n = Math.floor(n / 62);
        }
        if (arr.length === 0) {
            return '0';
        }
        return arr.reverse().join('');
    },
};

class RTError extends Error {
    constructor(status, type, data) {
        super(type);
        this.status = status;
        this.type = type;
        this.data = data || {};
        this.expose = true;
    }
}

exports.RTError = RTError;

const logger = require('./logger');

class IDHelper {
    constructor(root) {
        this.root = root;
        this.icache = {};
    }

    async findChildItem(pid, name) {
        throw new Error('unsupported method: findChildItem(' + pid + ',' + name + ')');
    }

    async getIDByPath(path = '/') {
        return this.getItemByPath(path).then((e) => e.id);
    }

    async getItemByPath(path) {
        return this._getItemByPath(
            path.split('/').filter((e) => e),
            {type: 1, id: this.root}
        );
    }

    async _getItemByPath(paths, item) {
        if (paths.length === 0) {
            return item;
        }
        const pid = item.id;
        const cache = this.icache[pid] || {};
        const name = paths.shift();
        if (!cache[name] || cache[name].etime < Date.now()) {
            logger.info('pid:' + pid + ' ' + name);
            const cItem = await this.findChildItem(pid, name);
            cItem.etime = Date.now() + 300000;
            cache[name] = cItem;
            // 保证path中出现的都是文件夹
            if (cItem.type !== 1 && paths.length > 0) {
                throw new RTError(404, 'ItemNotExist');
            }
        }
        this.icache[pid] = cache;
        return this._getItemByPath(paths, cache[name]);
    }
}

exports.IDHelper = IDHelper;

exports._P = (name, value, desc, level, placeholder_or_select, textarea, star, hidden) => {
    const r = {name, value, desc, level};
    if (Array.isArray(placeholder_or_select)) {
        r.select = placeholder_or_select;
    } else {
        r.placeholder = placeholder_or_select;
        if (textarea) {
            r.textarea = true;
        }
    }
    if (star) {
        r.star = true;
    }
    if (hidden) {
        r.hidden = true;
    }
    return r;
};