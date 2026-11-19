let userData = {
    storageKey: 'ticketlab',

    load: function() {
        let saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
        return { records: [] };
    },

    save: function(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    },

    addRecord: function(record) {
        let data = this.load();
        record.date = new Date().getTime();
        data.records.push(record);
        this.save(data);
    },

    getRecords: function(mode) {
        let records = this.load().records;
        let result = [];
        for (let i = 0; i < records.length; i++) {
            if (mode == undefined || records[i].mode == mode) {
                result.push(records[i]);
            }
        }
        return result;
    }
};
