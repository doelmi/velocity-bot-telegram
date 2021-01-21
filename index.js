require('dotenv').config();
const { Telegraf } = require('telegraf')
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN)
var response = '(kosong)'
var state = []

async function getCustomerMDXL(code) {
    let r = '';
    try {
        let headers = {
            'Content-Type': 'application/json',
            'Authorization': process.env.MDXL_TOKEN
        }
        let resp = await axios.post('https://sidigi.aksestoko.com/o/aksestoko/customer/getdatacustomer', { kodecustomer: code }, {
            headers
        });

        if (resp.data.status !== 200) {
            r = `Tidak ditemukan data pelanggan dengan kode '${code}'`
        } else {
            let store = resp.data.datas
            r = `Kode Toko : ${store.bisnisKokohId}`
            r += `\nNama Toko : ${store.storeName}`
            r += `\nNama Pemilik Toko : ${store.storeName}`
            r += `\nAlamat Toko : ${store.storeAddress}`
            r += `\nNo Handphone : ${store.phoneNumberOne}`
            r += `\nProvinsi : ${store.provinceName}`
            r += `\nKab/Kota : ${store.cityName}`
            r += `\nKec : ${store.districtName}`
            r += `\nDesa/Kel : ${store.subdistrictName}`
            r += `\nArea : ${store.areaName}`
            r += `\nRegion : ${store.regionalName}`

            for (const [index, dist] of store.listDistributor.entries()) {
                r += `\nDistributor ${index + 1} : ${dist.distributorName} (${dist.distributorCode})`
            }
        }
    } catch (error) {
        r = `(error)`
    }

    return r
}

async function getCustomerBK(code) {
    let r = '';
    try {
        let resp = await axios.post('https://3pl.sig.id/Api_distr_poin/data_toko_aktif_kdcustomer', { kdcustomer: code });
        if (resp.data.data.status === 'empty') {
            r = `Tidak ditemukan data pelanggan dengan kode '${code}'`
        } else {
            let store = resp.data.data.data[0]
            r = `Kode Toko : ${store.KD_CUSTOMER}`
            r += `\nNama Toko : ${store.NAMA_TOKO}`
            r += `\nNama Pemilik Toko : ${store.NM_CUSTOMER}`
            r += `\nAlamat Toko : ${store.ALAMAT_TOKO}`
            r += `\nNo Handphone : ${store.NO_HANDPHONE}`
            r += `\nProvinsi : ${store.PROVINSI}`
            r += `\nKab/Kota : ${store.NM_DISTRIK}`
            r += `\nKec : ${store.KECAMATAN}`
            r += `\nDesa/Kel : -`
            r += `\nArea : ${store.AREA}`
            r += `\nRegion : -`

            if (store.DISTRIBUTOR)
                r += `\nDistributor 1 : ${store.DISTRIBUTOR} (${store.NOMOR_DISTRIBUTOR})`
            if (store.DISTRIBUTOR2)
                r += `\nDistributor 2 : ${store.DISTRIBUTOR2} (${store.NOMOR_DISTRIBUTOR2})`
            if (store.DISTRIBUTOR3)
                r += `\nDistributor 3 : ${store.DISTRIBUTOR3} (${store.NOMOR_DISTRIBUTOR3})`
            if (store.DISTRIBUTOR4)
                r += `\nDistributor 4 : ${store.DISTRIBUTOR4} (${store.NOMOR_DISTRIBUTOR4})`
        }
    } catch (error) {
        r = `(error)`
    }
    return r
}

bot.start((ctx) => {
    let username = ctx.update.message.from.username
    response = `Halo ${username}! Perkenalkan, namaku Velocity 😉. Ketik /help untuk melihat perintah yang aku terima.`
    ctx.reply(response)
})
bot.help((ctx) => {
    response = `Berikut ini perintah yang aku terima:`
    response += `\n\nCek pelanggan SIG`
    response += `\n/cekidc_mdxl - cek di MDXL`
    response += `\n/cekidc_bk - cek di Bisnis Kokoh (3PL)`
    response += `\n/cekidc_pos - cek di ForcaPOS [Coming Soon]`

    ctx.reply(response)
})

bot.command('cekidc_mdxl', (ctx) => {
    state.push({ 'sender_id': ctx.update.message.from.id, 'step': 'cekidc_mdxl' })
    ctx.reply(`Perintah Cek IDC di MDXL. Masukkan Kode Pelanggan yang ingin dicari:`)
})
bot.command('cekidc_bk', (ctx) => {
    state.push({ 'sender_id': ctx.update.message.from.id, 'step': 'cekidc_bk' })
    ctx.reply(`Perintah Cek IDC di Bisnis Kokoh (3PL). Masukkan Kode Pelanggan yang ingin dicari:`)
})
bot.on('text', async (ctx) => {
    let sender_id = ctx.update.message.from.id
    let checkState = state.findIndex(x => x.sender_id === sender_id);
    let message = ctx.update.message.text.trim()
    if (checkState !== -1) {
        let s = state[checkState];
        state.splice(checkState, 1);
        switch (s.step) {
            case 'cekidc_mdxl':
                response = `Sedang mengecek kode '${message}' di MDXL`
                ctx.reply(response)
                response = await getCustomerMDXL(message)
                break;
            case 'cekidc_bk':
                response = `Sedang mengecek kode '${message}' di Bisnis Kokoh (3PL)`
                ctx.reply(response)
                response = await getCustomerBK(message)
                break;
            default:
                response = `(step tidak ditemukan)`
                break;
        }
    } else {
        response = `Masukan kamu adalah '${message}'`
    }
    return ctx.reply(response)
})
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))