
function isNullOrEmptyOrUndefined(value) {
    return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

function getCookie(k) {
    var cookies = " " + document.cookie;
    var key = " " + k + "=";
    var start = cookies.indexOf(key);

    if (start === -1) return null;

    var pos = start + key.length;
    var last = cookies.indexOf(";", pos);

    if (last !== -1) return cookies.substring(pos, last);

    return cookies.substring(pos);
}

function setCookie(k, v, expira, path) {
    if (!path) path = "/";

    var d = new Date();
    d.setTime(d.getTime() + (expira * 1000));

    document.cookie = encodeURIComponent(k) + "=" + encodeURIComponent(v) + "; expires=" + d.toUTCString() + "; path=" + path;
}

function removeCookie(k, path) {
    if (!path) path = "/";

    var d = new Date();
    var v = "";

    document.cookie = encodeURIComponent(k) + "=" + encodeURIComponent(v) + "; expires=" + d.toUTCString() + "; path=" + path;
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2){
      bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}

function bytesToHex(bytes) {
   return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getPools(carteira) {
    if (!window.cardano) {
      return { "err" : "nowallet"};
    }

//    const wasm = await import("https://cdn.jsdelivr.net/npm/@emurgo/cardano-serialization-lib-asmjs@9.1.2/cardano_serialization_lib.min.js");
    const wasm = await import("https://cdn.jsdelivr.net/npm/@emurgo/cardano-serialization-lib-asmjs@15.0.3/cardano_serialization_lib.min.js");

    switch (carteira) {
        case "eternl":
            api = await window.cardano.eternl.enable({'extensions': [{'cip':30}]});
            break;
        case "nufi":
            api = await window.cardano.nufi.enable({'extensions': [{'cip':30}]});
            break;
        case "nami":
            api = await window.cardano.nami.enable({'extensions': [{'cip':30}]});
            break;
        case "lace":
            api = await window.cardano.lace.enable({'extensions': [{'cip':30}]});
            break;
        default:
            throw new Error(`Wallet not supported : ${carteira}`);
    }

    const address = await api.getChangeAddress();

    const res = await api.getBalance();
    const balance = wasm.Value.from_bytes(hexToBytes(res));
    const lovelaces = balance.coin().to_str();
    const multiAsset = balance.multiasset();
    if (!multiAsset) {
      console.log("Sem multiassets.");
      return { "small" : createSmall(address), "address" : address, "ada" : lovelaces, "pool" : 0};
    }

    const policies = multiAsset.keys();
    for (let i = 0; i < policies.len(); i++) {
        const policyIdBytes = policies.get(i);
        const policyId = bytesToHex(policyIdBytes.to_bytes());
        if (policyId == "18079d745539795412bfef172cb204b6750404924638f3780bd212ec"){
            const listAssets = multiAsset.get(policyIdBytes);
            for (let j = 0; j < listAssets.len(); j++) {
                const assetNameBytes = listAssets.keys();
                for (let c = 0; c < assetNameBytes.len(); c++) {
                    const assetNameBin = assetNameBytes.get(c);
                    const assetName = bytesToHex(assetNameBin.name());
                    if (assetName == "0014df10504f4f4c") {
                        const quantity = listAssets.get(assetNameBin).to_str(); // string
//                        if (quantity == "undefined") {
//                           quantity = 0
//                        }
                        return { "small" : createSmall(address), "address" : address, "ada" : lovelaces, "pool" : quantity};
                    }
                };
            }
        }
    }
    return { "small" : createSmall(address), "address" : address, "ada" : lovelaces, "pool" : 0};
}

function createSmall(address){
    if (!address || address.length < 8) {
        return address;
    }
    return address.substring(0, 4) + "...." + address.substring(address.length - 4);
}

async function connectWallet() {
    const urlParams = new URLSearchParams(window.location.search);
    carteira = urlParams.get('w');
    if (isNullOrEmptyOrUndefined(carteira)) {
        carteira = getCookie("cardano");
    }else{
        var tempodevida = new Date();
        tempodevida.setTime(tempodevida + (100 * 60 * 60 * 24 * 2));
        setCookie("cardano", carteira, tempodevida);
    }

    if (!isNullOrEmptyOrUndefined(carteira)){
        user = await getPools(carteira);
        if (!isNullOrEmptyOrUndefined(user.small)){
            btn = document.getElementById("btn-connect")
            btn.textContent = user.small + ' (' + user.pool + ' POOL)'
            if (user.pool < 100) {
                return "buy";
            }
            return "success";
        }
    }
    return "fail";
}