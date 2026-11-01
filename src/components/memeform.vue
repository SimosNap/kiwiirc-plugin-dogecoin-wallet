<template>
    <div class="plugin-dogecoin-wallet-meme-form">
        <div class="plugin-dogecoin-wallet-meme-header">
            <strong>{{ $t('plugin-dogecoin-wallet:meme_title') }}</strong>
            <button type="button" @click="close">×</button>
        </div>

        <div v-if="!pluginState.memeStatus || pluginState.memeStatus === 'idle'">

            <textarea
                v-model="prompt"
                maxlength="1500"
                rows="3"
                :placeholder="$t('plugin-dogecoin-wallet:meme_prompt_placeholder')"
            />

            <div class="plugin-dogecoin-wallet-meme-options">
                <label>
                    {{ $t('plugin-dogecoin-wallet:meme_quality') }}
                    <select v-model.number="quality">
                        <option
                            v-for="level in 10"
                            :key="level"
                            :value="level"
                        >
                            {{ level }}/10
                        </option>
                    </select>
                </label>

            </div>

            <button
                type="button"
                class="plugin-dogecoin-wallet-meme-submit"
                :disabled="!prompt.trim()"
                @click="submit"
            >
                {{ $t('plugin-dogecoin-wallet:meme_generate') }}
            </button>

        </div>

        <div
            v-if="pluginState.memeStatus === 'sending'"
            class="plugin-dogecoin-wallet-meme-status plugin-dogecoin-wallet-meme-loading"
        >
            {{ $t('plugin-dogecoin-wallet:meme_request_sending') }}
        </div>

        <div
            v-if="pluginState.memeStatus === 'confirming'"
            class="plugin-dogecoin-wallet-meme-status plugin-dogecoin-wallet-meme-loading"
        >
            {{ $t('plugin-dogecoin-wallet:meme_confirming') }}
        </div>

        <div
            v-if="pluginState.memeStatus === 'confirmed'"
            class="plugin-dogecoin-wallet-meme-status"
        >
            <strong>{{ $t('plugin-dogecoin-wallet:meme_payment_title') }}</strong>

            <div>
                {{ $t('plugin-dogecoin-wallet:meme_payment_amount') }}:
                {{ pluginState.memePriceDOGE }} DOGE
            </div>

            <div>
                {{ $t('plugin-dogecoin-wallet:meme_payment_address') }}:
                {{ pluginState.memeAddress }}
            </div>

            <button
                type="button"
                @click="pay"
            >
                {{ $t('plugin-dogecoin-wallet:meme_payment_button') }}
            </button>
        </div>

        <div
            v-if="pluginState.memeStatus === 'received'"
            class="plugin-dogecoin-wallet-meme-status"
        >
            {{ $t('plugin-dogecoin-wallet:meme_request_received') }}
        </div>
        <div
            v-if="pluginState.memeStatus === 'quote'"
            class="plugin-dogecoin-wallet-meme-status"
        >
            <strong>{{ $t('plugin-dogecoin-wallet:meme_quote_title') }}</strong>

            <div>
                {{ $t('plugin-dogecoin-wallet:meme_quality') }}:
                {{ quality }}/10
            </div>

            <div>
                {{ pluginState.memePriceDOGE }} DOGE
                ({{ pluginState.memePriceEUR }} €)
            </div>

            <button
                type="button"
                :disabled="!pluginState.memeQuoteId"
                @click="confirm"
            >
                {{ $t('plugin-dogecoin-wallet:meme_confirm') }}
            </button>
        </div>
        <div
            v-if="pluginState.memeStatus === 'payment_pending'"
            class="plugin-dogecoin-wallet-meme-status plugin-dogecoin-wallet-meme-loading"
        >
            <strong>{{ $t('plugin-dogecoin-wallet:meme_payment_pending_title') }}</strong>
            <div>{{ $t('plugin-dogecoin-wallet:meme_payment_pending_description') }}</div>
            <div>{{ $t('plugin-dogecoin-wallet:meme_generation_wait') }}</div>
        </div>
        <div
            v-if="pluginState.memeStatus === 'generating'"
            class="plugin-dogecoin-wallet-meme-status plugin-dogecoin-wallet-meme-loading"
        >
            <strong>{{ $t('plugin-dogecoin-wallet:meme_generating_title') }}</strong>
            <div>{{ $t('plugin-dogecoin-wallet:meme_generating_description') }}</div>
        </div>
        <div
            v-if="pluginState.memeStatus === 'retry_available' || pluginState.memeStatus === 'retrying'"
            class="plugin-dogecoin-wallet-meme-status"
        >
            <strong>Generazione non riuscita</strong>

            <div>
                Il sistema di generazione ha rifiutato l'immagine.
                Puoi modificare la descrizione e riprovare senza pagare nuovamente.
            </div>

            <textarea
                v-model="prompt"
                maxlength="1500"
                rows="3"
                :disabled="pluginState.memeStatus === 'retrying'"
            />

            <button
                type="button"
                :disabled="!prompt.trim() || pluginState.memeStatus === 'retrying'"
                @click="retry"
            >
                {{ pluginState.memeStatus === 'retrying' ? 'Invio richiesta...' : 'Riprova gratuitamente' }}
            </button>
        </div>
        <div
            v-if="pluginState.memeStatus === 'completed' && pluginState.memeImageUrl"
            class="plugin-dogecoin-wallet-meme-preview"
        >
            <img
                :src="pluginState.memeImageUrl"
                alt="Meme"
            >

            <div class="plugin-dogecoin-wallet-meme-actions">
                <button type="button" @click="sendMeme">
                    {{ $t('plugin-dogecoin-wallet:meme_send') }}
                </button>

                <button type="button" @click="saveMeme">
                    {{ $t('plugin-dogecoin-wallet:meme_save') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MemeGeneratorForm',

    props: ['pluginState'],

    data() {
        return {
            prompt: '',
            quality: 5,
        };
    },

    methods: {
        close() {
            this.$state.$emit('input.tool');
        },

        submit() {
            const prompt = this.prompt.trim();

            if (!prompt || prompt.length > 1500) {
                return;
            }

            const network = this.$state.getActiveNetwork();

            if (!network || !network.ircClient) {
                console.error('[MEME] IRC connection unavailable');
                return;
            }

            const request = {
                action: 'request',
                quality: Number(this.quality),
                prompt,
            };

            this.pluginState.memeStatus = 'sending';

            network.ircClient.tagmsg('MediaBot', {
                '+simosnap.org/meme': JSON.stringify(request),
            });

            console.log('[MEME] Request sent', request);
        },
        confirm() {
            const quoteId = this.pluginState.memeQuoteId;

            if (!quoteId || this.pluginState.memeStatus !== 'quote') {
                return;
            }

            const network = this.$state.getActiveNetwork();

            if (!network || !network.ircClient) {
                console.error('[MEME] IRC connection unavailable');
                return;
            }

            this.pluginState.memeStatus = 'confirming';

            network.ircClient.tagmsg('MediaBot', {
                '+simosnap.org/meme': JSON.stringify({
                    action: 'confirm',
                    quoteId,
                }),
            });

            console.log('[MEME] Quote confirmation sent', quoteId);
        },
        async pay() {
            const address = this.pluginState.memeAddress;
            const amount = this.pluginState.memePriceDOGE;

            if (
                this.pluginState.memeStatus !== 'confirmed' ||
                !address ||
                !Number.isFinite(Number(amount)) ||
                Number(amount) <= 0
            ) {
                return;
            }

            const dogedrop = window.doge;

            if (!dogedrop || typeof dogedrop.requestTransaction !== 'function') {
                console.error('[MEME] DogeDrop wallet unavailable');
                return;
            }

            try {
                const transaction = await dogedrop.requestTransaction({
                    recipientAddress: address,
                    dogeAmount: Number(amount),
                    fee: 'slow',
                });
                console.log('[MEME] Transaction submitted', transaction.txId);
                this.pluginState.memeStatus = 'payment_pending';
            } catch (err) {
                console.error('[MEME] Payment failed or cancelled', err);
            }
        },
        retry() {
            const prompt = this.prompt.trim();
            const quoteId = this.pluginState.memeQuoteId;

            if (
                this.pluginState.memeStatus !== 'retry_available' ||
                !quoteId ||
                !prompt ||
                prompt.length > 1500
            ) {
                return;
            }

            const network = this.$state.getActiveNetwork();

            if (!network || !network.ircClient) {
                console.error('[MEME] IRC connection unavailable');
                return;
            }

            this.pluginState.memeStatus = 'retrying';

            network.ircClient.tagmsg('MediaBot', {
                '+simosnap.org/meme': JSON.stringify({
                    action: 'retry',
                    quoteId,
                    prompt,
                }),
            });

            console.log('[MEME] Retry requested', quoteId);
        },
        saveMeme() {
            const url = this.pluginState.memeImageUrl;

            if (!url || this.pluginState.memeStatus !== 'completed') {
                return;
            }

            const link = document.createElement('a');
            link.href = url;
            link.download = url.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        sendMeme() {
            const url = this.pluginState.memeImageUrl;
            const buffer = this.$state.getActiveBuffer();
            const network = this.$state.getActiveNetwork();

            if (
                this.pluginState.memeStatus !== 'completed' ||
                !url ||
                !buffer ||
                !buffer.name ||
                !network ||
                !network.ircClient
            ) {
                return;
            }

            buffer.say(url, {
                tags: {
                    '+kiwiirc.com/meme': JSON.stringify({ type: 'image/png' }),
                },
            });

            this.close();
        },
    },
};
</script>

<style>
.plugin-dogecoin-wallet-meme-form {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 10px;
    color: inherit;
}

/* Header */

.plugin-dogecoin-wallet-meme-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid color-mix(in srgb, currentColor 15%, transparent);
}

.plugin-dogecoin-wallet-meme-header strong {
    font-size: 14px;
    font-weight: 600;
}

.plugin-dogecoin-wallet-meme-header button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: inherit;
    font-size: 20px;
    cursor: pointer;
    opacity: 0.7;
}

.plugin-dogecoin-wallet-meme-header button:hover {
    opacity: 1;
    background: color-mix(in srgb, currentColor 10%, transparent);
}

/* Prompt */

.plugin-dogecoin-wallet-meme-form textarea {
    box-sizing: border-box;
    display: block;
    width: 100%;
    min-height: 70px;
    padding: 8px;
    border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
    border-radius: 5px;
    background: color-mix(in srgb, currentColor 5%, transparent);
    color: inherit;
    font: inherit;
    font-size: 13px;
    line-height: 1.4;
    resize: vertical;
    outline: none;
}

.plugin-dogecoin-wallet-meme-form textarea:focus {
    border-color: currentColor;
}

.plugin-dogecoin-wallet-meme-form textarea::placeholder {
    color: inherit;
    opacity: 0.5;
}

/* Qualità */

.plugin-dogecoin-wallet-meme-options {
    display: flex;
    align-items: center;
    margin: 10px 0;
}

.plugin-dogecoin-wallet-meme-options label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
}

.plugin-dogecoin-wallet-meme-options select {
    box-sizing: border-box;
    min-width: 75px;
    height: 32px;
    padding: 4px 8px;
    border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
    border-radius: 5px;
    background: var(--brand-default-bg, transparent);
    color: inherit;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
}

/* Pulsanti */

.plugin-dogecoin-wallet-meme-form button {
    font-family: inherit;
    transition: opacity 0.15s ease, background 0.15s ease;
}

.plugin-dogecoin-wallet-meme-submit,
.plugin-dogecoin-wallet-meme-status button,
.plugin-dogecoin-wallet-meme-actions button {
    box-sizing: border-box;
    min-height: 34px;
    padding: 7px 12px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    border-radius: 5px;
    background: color-mix(in srgb, currentColor 12%, transparent);
    color: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.plugin-dogecoin-wallet-meme-submit {
    width: 100%;
}

.plugin-dogecoin-wallet-meme-submit:hover:not(:disabled),
.plugin-dogecoin-wallet-meme-status button:hover:not(:disabled),
.plugin-dogecoin-wallet-meme-actions button:hover:not(:disabled) {
    background: color-mix(in srgb, currentColor 20%, transparent);
}

.plugin-dogecoin-wallet-meme-form button:disabled {
    opacity: 0.4;
    cursor: default;
}

/* Preventivo, pagamento e stati */

.plugin-dogecoin-wallet-meme-status {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, currentColor 4%, transparent);
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: anywhere;
}

.plugin-dogecoin-wallet-meme-status strong {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
}

.plugin-dogecoin-wallet-meme-status > div {
    margin: 4px 0;
}

.plugin-dogecoin-wallet-meme-status button {
    display: block;
    width: 100%;
    margin-top: 10px;
}

/* Indicatore di attesa */

.plugin-dogecoin-wallet-meme-loading {
    text-align: center;
}

.plugin-dogecoin-wallet-meme-loading::before {
    content: '';
    display: block;
    width: 20px;
    height: 20px;
    margin: 0 auto 10px;
    border: 2px solid color-mix(in srgb, currentColor 15%, transparent);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: meme-loading 0.8s linear infinite;
}

@keyframes meme-loading {
    to {
        transform: rotate(360deg);
    }
}

/* Anteprima del meme */

.plugin-dogecoin-wallet-meme-preview {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, currentColor 4%, transparent);
}

.plugin-dogecoin-wallet-meme-preview img {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 256px;
    max-width: min(100%, 256px);
    margin: 0 auto;
    border-radius: 5px;
    object-fit: contain;
}

/* Invia e Salva */

.plugin-dogecoin-wallet-meme-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
}

.plugin-dogecoin-wallet-meme-actions button {
    flex: 1;
    min-width: 0;
}

/* Mobile */

@media (max-width: 480px) {
    .plugin-dogecoin-wallet-meme-form {
        padding: 8px;
    }

    .plugin-dogecoin-wallet-meme-header {
        margin-bottom: 8px;
    }

    .plugin-dogecoin-wallet-meme-options {
        margin: 8px 0;
    }

    .plugin-dogecoin-wallet-meme-status,
    .plugin-dogecoin-wallet-meme-preview {
        padding: 8px;
    }

    .plugin-dogecoin-wallet-meme-actions {
        gap: 6px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .plugin-dogecoin-wallet-meme-loading::before {
        animation: none;
    }
}
</style>
