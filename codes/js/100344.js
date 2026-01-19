import { AdminPanelPlugin } from 'svelite-admin'
import * as modules from './modules'

const collections = [
    // collection definition..
    // You can use chatgpt_prompt and change ## Prompt section 
    // to build initial structure of your data models.
]

export default {
    plugins: [
       AdminPanelPlugin({
           collections,
           logo: '',
           theme: 'light', // 'dark',
           dir: 'ltr',
           modules
            // admin panel config...
         }),
    ],
    // custom modules
    modules: {},
    // custom layouts
    layouts: {},
    pages: [
        {
            slug: 'hello', 
            title: 'Hello', 
            modules: [
                { name: "Header", props: {}},
                {
                    name: 'HelloWorld', 
                    props: {}
                }
            ]
        }
    ],
    api: 'http://localhost:3010/api'
}
