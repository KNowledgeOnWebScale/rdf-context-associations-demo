class CreatedResourceStore {
    // Hold a reference to the single created instance
    // of the Singleton, initially set to null.
    private static instance: CreatedResourceStore | null = null;
    private resources: string[] = [];

    // Make the constructor private to block instantiation
    // outside of the class.
    private constructor() {
        // initialization code
    }

    // Provide a static method that allows access
    // to the single instance.
    public static getInstance(): CreatedResourceStore {
        // Check if an instance already exists.
        // If not, create one.
        if (this.instance === null) {
            this.instance = new CreatedResourceStore();
        }
        // Return the instance.
        return this.instance;
    }

    // Example method to show functionality.
    public addResourceURL(url: string) {
        this.resources.push(url)
    }

    public getResources() {
        return this.resources
    }
}

export default CreatedResourceStore