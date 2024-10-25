class MiniIsland extends HTMLElement {
    static tagName = "mini-island";
    
    static attributes = {
        dataIsland: "data-island"
    }

    async connectedCallback() {
        await this.hydrate()
    }

    async hydrate() {
        const conditions = []
        let conditionsAttributeMap = Conditions.getConditions(this);

        for (const condition in conditionsAttributeMap) {
            const conditionFunction = Conditions.map[condition];

            if(conditionFunction){
                const conditionPromise = conditionFunction(conditionsAttributeMap[condition], 
                    this
                );
                conditions.push(conditionPromise)
            }
        }

        // await condition promise
        await Promise.all(conditions)
        // deal with this
        const relevantChildTemplates = this.getTemplates();
        this.replaceTemplates(relevantChildTemplates);
    }

    replaceTemplates(templates) {
        for (const node of templates) {
            node.replaceWith(node.content);
        }
    }

    getTemplates() {
        return this.querySelectorAll(`template[${MiniIsland.attributes.dataIsland}]`);
    }
}

class Conditions {
    static map = {
        media: Conditions.waitForMedia,
        idle: Conditions.waitForIdle,
        visible: Conditions.waitForVisible,
    }

    static waitForMedia(query) {
        let queryList = {
            matches: true
        }

        if(query && "matchMedia" in window) {
            queryList = window.matchMedia(query)
        }

        if(queryList.matches){
            return;
        }
        return new Promise((resolve) => {
            queryList.addListener((e) => {
                if(e.matches){
                    resolve();
                }
            });
        });
    }

    static waitForIdle() {
        return new Promise((resolve) => resolve())
    }

    static waitForVisible(noop, el) {
        if(!("IntersectionObserver" in window)){
            return
        }

        return new Promise((resolve) => {
            let observer = new IntersectionObserver((entries) => {
                let[entry] = entries;

                if(entry.isIntersecting) {
                    observer.unobserve(entry.target)
                    resolve();
                }
            });
            
            observer.observe(el);
        });
    }

    static getConditions(node) {
        let result = {}

        for (const condition of Object.keys(Conditions.map)){
            if(node.hasAttribute(`client:${condition}`)){
                result[condition] = node.getAttribute(`client:${condition}`)
            }
        }
         
        return result;
    }

    static hasConditions(node) {
       const conditionsAttributeMap = Conditions.getConditions(node);

       return Object.keys(conditionsAttributeMap).length > 0;
    }
}

if("customElements" in window) {
    window.customElements.define(MiniIsland.tagName, MiniIsland)
} else {
    console.error(
        "Island cannot be initiated because Window.customElements is unavailable"
    )
}

