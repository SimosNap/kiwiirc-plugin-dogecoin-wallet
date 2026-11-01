import fallbackLocale from '@/res/locales/en-us.json';
import DogecoinWallet from './components/dogecoinwallet.vue';
import DogeCoin from './components/dogecoin.vue';
import TipMsg from './components/tipmsg.vue';
import ExtraInfo from './components/extrainfo.vue';
import MemeGenerator from './components/memegenerator.vue';

// eslint-disable-next-line no-undef
kiwi.plugin('dogecoin-wallet', (kiwi) => {
    // setup the plugins locales
    const localesPath = 'plugins/plugin-dogecoin-wallet/locales/{{lng}}.json';
    if (localesPath.includes('{{lng}}')) {
        kiwi.addTranslationFiles('plugin-dogecoin-wallet', localesPath, fallbackLocale);
    } else {
        kiwi.addTranslationFiles('plugin-dogecoin-wallet', 'plugins/plugin-dogecoin-wallet/locales/', fallbackLocale);
    }

    let pluginState = new kiwi.Vue({
        data() {
            return {
                connected: false,
                balance: 0,
                activeWallet: false,
                memeStatus: '',
                memePriceEUR: '',
                memePriceDOGE: '',
                memeQuoteId: '',
                memeAddress: '',
                memeImageUrl: '',
            };
        },
    });
    kiwi.addUi('browser', DogecoinWallet, { props: { pluginState } });
    kiwi.addUi('input', MemeGenerator, { props: { pluginState } });
    kiwi.addUi('userbox_button', DogeCoin, { props: { pluginState } });
    kiwi.addUi('about_buffer', ExtraInfo, {
        title: kiwi.i18n.t('plugin-dogecoin-wallet:extra_info'),
        props: { pluginState },
    });

    kiwi.on('message.new', (event) => {
        let message = event.message;

        if (message.type !== 'notice' || !message.tags || !message.tags['+simosnap.org/tip']) {
            return;
        }

        let tData = message.tags['+simosnap.org/tip'].split(';');
        let tAmount = tData[0];
        let tID = tData[1];
        let nickname = event.message.nick;

        event.message.bodyTemplate = kiwi.Vue.extend(TipMsg);
        event.message.type = 'privmsg'; event.message.nick = '';
        event.message.bodyTemplateProps = {
            id: tID,
            amount: tAmount,
            nickname: nickname,
            self: false,
        };
    });

    kiwi.on('irc.raw.TAGMSG', (event, message, network) => {
        if (
            message.nick !== 'MediaBot' ||
            message.params[0] !== network.nick ||
            !message.tags ||
            !message.tags['+simosnap.org/meme']
        ) {
            return;
        }

        let data;

        try {
            data = JSON.parse(message.tags['+simosnap.org/meme']);
        } catch (err) {
            console.warn('[MEME] Invalid TAGMSG from MediaBot');
            return;
        }

        if (data.action === 'received') {
            console.log('[MEME] MediaBot confirmation received', data);
            pluginState.memeStatus = 'received';
            return;
        }

        if (data.action === 'quote') {
            console.log('[MEME] MediaBot quote received', data);

            pluginState.memePriceEUR = data.priceEUR;
            pluginState.memePriceDOGE = data.priceDOGE;
            pluginState.memeStatus = 'quote';
            pluginState.memeQuoteId = data.quoteId;
        }

        if (data.action === 'confirmed') {
            if (data.quoteId !== pluginState.memeQuoteId) {
                return;
            }

            console.log('[MEME] MediaBot quote confirmed', data);
            pluginState.memeAddress = data.address;
            pluginState.memePriceDOGE = data.priceDOGE;
            pluginState.memeStatus = 'confirmed';
        }

        if (data.action === 'generating') {
            if (data.quoteId !== pluginState.memeQuoteId) return;

            pluginState.memeStatus = 'generating';
            return;
        }

        if (data.action === 'retry_available') {
            if (data.quoteId !== pluginState.memeQuoteId) return;

            console.log('[MEME] Retry available', data);
            pluginState.memeStatus = 'retry_available';
            return;
        }

        if (data.action === 'retry_accepted') {
            if (data.quoteId !== pluginState.memeQuoteId) return;

            console.log('[MEME] Retry accepted', data);
            pluginState.memeStatus = 'generating';
            return;
        }

        if (data.action === 'error' && data.reason === 'retry_invalid') {
            console.warn('[MEME] Retry rejected', data);
            pluginState.memeStatus = 'retry_available';
            return;
        }

        if (data.action === 'completed') {
            if (data.quoteId !== pluginState.memeQuoteId) {
                return;
            }

            console.log('[MEME] Meme generated', data);

            pluginState.memeImageUrl = data.url;
            pluginState.memeStatus = 'completed';
        }
    });
});
