export function useFlowbite(callback: Function) {
    if (import.meta.client) {
        import('flowbite').then((flowbite) => {
            callback(flowbite)
        })
    }
}