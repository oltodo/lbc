
module.exports = (function() {

    var proxies = [
        { ip: '162.216.0.98'    port: 80    },
        { ip: '209.170.151.142' port: 7808  },
        { ip: '199.193.252.235' port: 7808  },
        { ip: '23.89.198.161'   port: 7808  },
        { ip: '173.245.65.46'   port: 8888  },
        { ip: '172.245.142.194' port: 8080  },
        { ip: '173.245.65.14'   port: 8888  },
        { ip: '199.200.120.140' port: 3127  },
        { ip: '192.227.139.227' port: 3127  },
        { ip: '66.85.131.18'    port: 7808  },
        { ip: '108.163.254.214' port: 8089  },
        { ip: '216.189.101.121' port: 7808  },
        { ip: '107.182.135.94'  port: 8089  },
        { ip: '64.188.44.103'   port: 7808  },
        { ip: '198.148.112.46'  port: 7808  },
        { ip: '198.204.242.107' port: 808   },
        { ip: '198.204.238.36'  port: 808   },
        { ip: '198.204.241.19'  port: 808   },
        { ip: '198.204.234.94'  port: 808   },
        { ip: '198.204.234.93'  port: 808   },
        { ip: '198.204.234.6'   port: 808   },
        { ip: '198.204.245.244' port: 808   },
        { ip: '198.204.244.52'  port: 808   },
        { ip: '198.204.240.37'  port: 808   },
        { ip: '107.17.92.18'    port: 8080  },
        { ip: '107.182.135.43'  port: 7808  },
        { ip: '173.245.65.86'   port: 8888  },
        { ip: '192.3.150.38'    port: 3128  },
        { ip: '198.204.234.78'  port: 808   },
        { ip: '66.55.138.149'   port: 3127  },
        { ip: '173.245.65.158'  port: 8888  },
        { ip: '198.204.231.198' port: 808   },
        { ip: '198.204.235.133' port: 808   },
        { ip: '198.204.241.22'  port: 808   },
        { ip: '198.204.240.36'  port: 808   },
        { ip: '198.204.235.220' port: 808   },
        { ip: '198.204.240.117' port: 808   },
        { ip: '198.204.248.68'  port: 808   },
        { ip: '198.204.235.107' port: 808   },
        { ip: '198.204.247.244' port: 808   },
        { ip: '198.204.235.91'  port: 808   },
        { ip: '198.204.232.141' port: 808   },
        { ip: '198.204.235.94'  port: 808   },
        { ip: '198.204.244.94'  port: 808   },
        { ip: '198.204.247.246' port: 808   },
        { ip: '198.204.235.132' port: 808   },
        { ip: '198.204.240.35'  port: 808   },
        { ip: '198.204.235.134' port: 808   },
        { ip: '198.204.231.156' port: 808   },
        { ip: '198.204.242.108' port: 808   },
        { ip: '107.182.16.221'  port: 7808  },
        { ip: '199.241.137.180' port: 7808  },
        { ip: '173.245.65.6'    port: 8888  },
        { ip: '66.35.68.145'    port: 8089  },
        { ip: '198.204.231.126' port: 808   },
        { ip: '198.204.245.29'  port: 808   },
        { ip: '198.204.234.92'  port: 808   },
        { ip: '12.179.129.212'  port: 8080  },
        { ip: '198.204.239.94'  port: 808   },
        { ip: '173.245.65.54'   port: 8888  },
        { ip: '70.94.254.118'   port: 21320 },
        { ip: '198.204.231.205' port: 808   },
        { ip: '205.134.224.21'  port: 3127  },
        { ip: '208.74.120.134'  port: 80    },
        { ip: '173.245.65.134'  port: 8888  },
        { ip: '173.245.65.142'  port: 8888  },
        { ip: '198.204.238.59'  port: 808   },
        { ip: '198.204.238.35'  port: 808   },
        { ip: '198.204.231.197' port: 808   },
        { ip: '198.204.234.3'   port: 808   },
        { ip: '69.214.2.173'    port: 21320 },
        { ip: '67.168.13.157'   port: 21320 },
        { ip: '198.204.231.60'  port: 808   },
        { ip: '64.186.149.57'   port: 8080  },
        { ip: '198.204.235.4'   port: 808   },
        { ip: '192.161.48.8'    port: 3128  },
        { ip: '198.204.244.156' port: 808   },
        { ip: '199.200.120.36'  port: 8089  },
        { ip: '198.204.231.59'  port: 808   },
        { ip: '107.22.34.193'   port: 80    },
        { ip: '24.172.34.114'   port: 8181  },
        { ip: '23.243.28.30'    port: 21320 },
        { ip: '64.179.51.158'   port: 8080  },
        { ip: '75.144.242.89'   port: 7004  },
        { ip: '192.187.106.2'   port: 8080  },
        { ip: '198.211.98.113'  port: 80    },
        { ip: '198.58.109.120'  port: 80    },
        { ip: '173.255.225.173' port: 8118  },
        { ip: '76.22.66.53'     port: 21320 },
        { ip: '173.245.65.38'   port: 8888  },
        { ip: '69.254.73.158'   port: 21320 },
        { ip: '73.183.50.139'   port: 21320 },
        { ip: '69.14.188.200'   port: 21320 },
        { ip: '72.208.210.105'  port: 8080  },
        { ip: '198.204.232.30'  port: 808   },
        { ip: '208.238.174.104' port: 8080  },
        { ip: '54.85.54.221'    port: 80    },
        { ip: '198.204.245.52'  port: 808   },
        { ip: '107.17.185.104'  port: 8080  },
        { ip: '198.204.238.28'  port: 808   },
        { ip: '54.86.150.62'    port: 80    },
        { ip: '184.105.18.60'   port: 7808  },
        { ip: '198.52.217.44'   port: 3127  },
        { ip: '199.193.252.243' port: 7808  },
        { ip: '76.164.213.124'  port: 7808  },
        { ip: '198.204.240.20'  port: 808   },
        { ip: '198.23.251.248'  port: 7808  },
        { ip: '198.204.245.53'  port: 808   },
        { ip: '174.128.235.190' port: 80    },
        { ip: '174.128.235.176' port: 80    },
        { ip: '174.128.235.167' port: 80    },
        { ip: '174.128.235.178' port: 80    },
        { ip: '67.45.172.205'   port: 87    },
        { ip: '50.77.35.68'     port: 8080  },
        { ip: '174.128.235.164' port: 80    },
        { ip: '174.128.235.169' port: 80    },
        { ip: '64.156.80.36'    port: 80    },
        { ip: '174.128.235.168' port: 80    },
        { ip: '174.128.235.181' port: 80    },
        { ip: '174.128.235.165' port: 80    },
        { ip: '174.128.235.189' port: 80    },
        { ip: '174.128.235.175' port: 80    },
        { ip: '128.123.6.60'    port: 3128  },
        { ip: '174.128.235.170' port: 80    },
        { ip: '66.82.69.186'    port: 80    },
        { ip: '180.94.86.163'   port: 8080  },
        { ip: '184.82.27.226'   port: 3128  },
        { ip: '54.187.214.119'  port: 80    },
        { ip: '74.118.192.53'   port: 3128  },
        { ip: '198.204.238.38'  port: 808   },
        { ip: '198.204.235.188' port: 808   },
        { ip: '198.204.232.27'  port: 808   },
        { ip: '198.204.240.19'  port: 808   },
        { ip: '198.204.235.5'   port: 808   },
        { ip: '198.204.243.134' port: 808   },
        { ip: '198.204.235.189' port: 808   },
        { ip: '198.204.245.246' port: 808   },
        { ip: '198.204.231.206' port: 808   },
        { ip: '198.204.234.75'  port: 808   },
        { ip: '198.204.245.30'  port: 808   },
        { ip: '23.94.44.6'      port: 7808  },
        { ip: '23.94.44.10'     port: 7808  },
        { ip: '198.204.245.51'  port: 808   },
        { ip: '198.204.235.68'  port: 808   },
        { ip: '198.204.240.38'  port: 808   },
        { ip: '198.204.236.164' port: 808   },
        { ip: '198.204.243.133' port: 808   },
        { ip: '198.204.234.28'  port: 808   },
        { ip: '198.204.242.109' port: 808   },
        { ip: '198.204.231.189' port: 808   },
        { ip: '198.204.245.54'  port: 808   },
        { ip: '74.125.7.202'    port: 80    },
        { ip: '74.125.10.244'   port: 80    },
        { ip: '173.194.65.152'  port: 80    },
        { ip: '74.125.7.53'     port: 80    },
        { ip: '173.194.35.155'  port: 80    },
        { ip: '74.125.7.203'    port: 80    },
        { ip: '74.125.10.195'   port: 80    },
        { ip: '74.125.7.169'    port: 80    },
        { ip: '173.194.65.63'   port: 80    },
    ];

    var current = 0;

    return {

        getRand: function () {
            var key = utils.rand(0, proxies.length-1);
            key = 2;
            return proxies[key];
        },

        getNext: function () {
            if(current == proxies.length) {
                current = 0;
            }

            current++;
            return proxies[current-1];
        }
    };
})();
