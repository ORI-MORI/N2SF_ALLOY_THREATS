<template>
    <div>
        <b-row>
            <b-col md="2">
                <div ref="stencil_container"></div>
            </b-col>
            <b-col md="10">
                <b-row>
                    <b-col>
                        <h3 class="td-graph-title">{{ diagram.title }}</h3>
                    </b-col>
                    <b-col align="right">
                        <td-graph-buttons :graph="graph" @saved="saved" @closed="closed" @analyze="analyze" />
                    </b-col>
                </b-row>
                <b-row>
                    <b-col style="display: flex;    width: 100vw; ">
                        <div
                            id="graph-container"
                            ref="graph_container"
                            style="height: 65vh; width: 100%; flex: 1; "
                        ></div>
                    </b-col>
                </b-row>
            </b-col>
        </b-row>
        <td-graph-meta @threatSelected="threatSelected" @threatSuggest="threatSuggest" />

        <div>
            <td-keyboard-shortcuts />
            <td-threat-edit-dialog ref="threatEditDialog" />
            <td-threat-suggest-dialog ref="threatSuggestDialog" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.td-graph-title {
    margin-right: 15px;
}
</style>

<script>
import { mapState } from 'vuex';

import TdGraphButtons from '@/components/GraphButtons.vue';
import TdGraphMeta from '@/components/GraphMeta.vue';
import TdKeyboardShortcuts from '@/components/KeyboardShortcuts.vue';
import TdThreatEditDialog from '@/components/ThreatEditDialog.vue';
import TdThreatSuggestDialog from './ThreatSuggestDialog.vue';

import { getProviderType } from '@/service/provider/providers.js';
import diagramService from '@/service/diagram/diagram.js';
import stencil from '@/service/x6/stencil.js';
import tmActions from '@/store/actions/threatmodel.js';

export default {
    name: 'TdGraph',
    components: {
        TdGraphButtons,
        TdGraphMeta,
        TdKeyboardShortcuts,
        TdThreatEditDialog,
        TdThreatSuggestDialog
    },
    computed: mapState({
        diagram: (state) => state.threatmodel.selectedDiagram,
        providerType: (state) => getProviderType(state.provider.selected)
    }),
    data() {
        return {
            graph: null
        };
    },
    async mounted() {
        this.init();
    },
    methods: {
        init() {
            this.graph = diagramService.edit(this.$refs.graph_container, this.diagram);
            stencil.get(this.graph, this.$refs.stencil_container);
            this.$store.dispatch(tmActions.notModified);
            this.graph.getPlugin('history').on('change', () => {
                const updated = Object.assign({}, this.diagram);
                updated.cells = this.graph.toJSON().cells;
                this.$store.dispatch(tmActions.diagramModified, updated);
            });
        },
        threatSelected(threatId,state) {
            this.$refs.threatEditDialog.editThreat(threatId,state);
        },
        threatSuggest(type){
            this.$refs.threatSuggestDialog.showModal(type);
        },
        saved() {
            console.debug('Save diagram');
            const updated = Object.assign({}, this.diagram);
            updated.cells = this.graph.toJSON().cells;
            this.$store.dispatch(tmActions.diagramSaved, updated);
            this.$store.dispatch(tmActions.saveModel);
        },
        async analyze() {
            console.debug('Analyze diagram');
            const payload = {
                detail: {
                    diagrams: [
                        {
                            diagramJson: {
                                cells: this.graph.toJSON().cells
                            }
                        }
                    ]
                }
            };

            try {
                const response = await fetch('http://localhost:5000/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    const violations = result.violations;
                    if (violations.length > 0) {
                        this.$bvToast.toast(`Found ${violations.length} violations! Check console for details.`, {
                            title: 'Analysis Result',
                            variant: 'danger',
                            solid: true
                        });
                        console.table(violations);
                    } else {
                        this.$bvToast.toast('No violations found. System is secure.', {
                            title: 'Analysis Result',
                            variant: 'success',
                            solid: true
                        });
                    }
                } else {
                    this.$bvToast.toast('Analysis failed: ' + result.error, {
                        title: 'Error',
                        variant: 'warning',
                        solid: true
                    });
                }
            } catch (error) {
                console.error(error);
                this.$bvToast.toast('Network error connecting to backend.', {
                    title: 'Error',
                    variant: 'danger',
                    solid: true
                });
            }
        },
        async closed() {
            if (!this.$store.getters.modelChanged || await this.getConfirmModal()) {
                await this.$store.dispatch(tmActions.diagramClosed);
                this.$router.push({ name: `${this.providerType}ThreatModel`, params: this.$route.params });
            }
        },
        getConfirmModal() {
            return this.$bvModal.msgBoxConfirm(this.$t('forms.discardMessage'), {
                title: this.$t('forms.discardTitle'),
                okVariant: 'danger',
                okTitle: this.$t('forms.ok'),
                cancelTitle: this.$t('forms.cancel'),
                hideHeaderClose: true,
                centered: true
            });
        }
    },
    destroyed() {
        diagramService.dispose(this.graph);
    }
};
</script>