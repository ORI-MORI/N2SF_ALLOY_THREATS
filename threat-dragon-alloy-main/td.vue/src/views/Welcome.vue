<template>
    <b-container fluid class="welcome-container d-flex flex-column align-items-center justify-content-center">
        <b-jumbotron header="Welcome to OTD with Alloy" lead="N2SF Intelligent Audit System" class="text-center bg-transparent">
            <p>Design your network architecture and analyze security threats using Alloy Analyzer.</p>
            <div class="mt-4">
                <b-button variant="primary" size="lg" class="m-2" @click="createNewModel">
                    <font-awesome-icon icon="plus" class="mr-2" />
                    New Diagram
                </b-button>
                <b-button variant="secondary" size="lg" class="m-2" @click="loadModel">
                    <font-awesome-icon icon="folder-open" class="mr-2" />
                    Load JSON
                </b-button>
            </div>
        </b-jumbotron>
        
        <!-- Hidden file input for loading -->
        <input type="file" ref="fileInput" style="display: none" accept=".json" @change="onFileSelected" />
    </b-container>
</template>

<script>
import { mapActions } from 'vuex';
import tmActions from '@/store/actions/threatmodel.js';
import { providerTypes } from '@/service/provider/providerTypes';

export default {
    name: 'WelcomePage',
    methods: {
        ...mapActions({
            selectProvider: 'provider/selected'
        }),
        async createNewModel() {
            // 1. Select Local Provider (simplest for this use case)
            this.$store.dispatch('provider/selected', providerTypes.local);
            
            // 2. Create a default model structure
            const newModel = {
                summary: {
                    title: 'New Architecture',
                    owner: 'User',
                    description: 'Network architecture for N2SF audit.',
                    id: 0
                },
                detail: {
                    contributors: [],
                    diagrams: [],
                    reviewer: '',
                    threatTop: 0,
                    diagramTop: 0
                }
            };

            // 3. Commit to store
            this.$store.commit(tmActions.THREATMODEL_SELECTED, newModel);
            
            // 4. Navigate to Threat Model Edit page (where they can add diagrams)
            // Ideally we want to jump straight to a diagram, but we need a diagram first.
            // Let's create a default diagram too.
            const defaultDiagram = {
                id: 0,
                title: 'Main Network',
                diagramType: 'STRIDE',
                placeholder: 'Main network diagram',
                thumbnail: './public/content/images/thumbnail.stride.jpg',
                version: '2.0',
                cells: []
            };
            newModel.detail.diagrams.push(defaultDiagram);
            newModel.detail.diagramTop = 1;
            
            // Update store again with diagram
            this.$store.commit(tmActions.THREATMODEL_SELECTED, newModel);
            this.$store.commit(tmActions.THREATMODEL_DIAGRAM_SELECTED, defaultDiagram);

            // 5. Navigate directly to diagram editor
            this.$router.push({ name: 'localDiagramEdit', params: { threatmodel: 'New Architecture', diagram: 'Main Network' } });
        },
        loadModel() {
            this.$refs.fileInput.click();
        },
        onFileSelected(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    // Select Local Provider
                    this.$store.dispatch('provider/selected', providerTypes.local);
                    // Load model into store
                    this.$store.commit(tmActions.THREATMODEL_SELECTED, json);
                    
                    // If there are diagrams, select the first one and go to editor
                    if (json.detail && json.detail.diagrams && json.detail.diagrams.length > 0) {
                        const firstDiagram = json.detail.diagrams[0];
                        this.$store.commit(tmActions.THREATMODEL_DIAGRAM_SELECTED, firstDiagram);
                        this.$router.push({ name: 'localDiagramEdit', params: { threatmodel: json.summary.title, diagram: firstDiagram.title } });
                    } else {
                        // If no diagrams, go to model edit
                        this.$router.push({ name: 'localThreatModelEdit', params: { threatmodel: json.summary.title } });
                    }
                } catch (err) {
                    console.error("Error parsing JSON", err);
                    alert("Invalid JSON file");
                }
            };
            reader.readAsText(file);
        }
    }
};
</script>

<style scoped>
.welcome-container {
    height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
</style>
