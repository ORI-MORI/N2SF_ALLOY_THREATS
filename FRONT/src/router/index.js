import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '../views/Welcome.vue'
import Editor from '../views/Editor.vue'

const routes = [
    { path: '/', component: Welcome },
    { path: '/editor', component: Editor }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
