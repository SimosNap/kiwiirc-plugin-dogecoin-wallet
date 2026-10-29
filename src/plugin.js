import fallbackLocale from '@/res/locales/en-us.json';
import DogecoinWallet from './components/dogecoinwallet.vue';
import DogeCoin from './components/dogecoin.vue';
import TipMsg from './components/tipmsg.vue';
import ExtraInfo from './components/extrainfo.vue';

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
            };
        },
    });
    kiwi.addUi('browser', DogecoinWallet, { props: { pluginState } });
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
});
