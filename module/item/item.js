/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class RyuutamaItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (itemData.type === "container" || itemData.type === "animal") this._prepareItemData(itemData, actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareItemData(itemData, actorData) {
        const data = itemData.data;

        if (actorData._id === undefined) {
            data.holding = [];
            return
        };

        const holding = itemData.data.holding;
        let holdingAmount = 0;

        holding.forEach(item => {
            const heldItem = actorData.items.find(i => i._id === item.id);
            if (heldItem === undefined) {
                itemData.data.holding = itemData.data.holding.filter(i => i.id !== item.id);
            } else {
                holdingAmount += Number(heldItem.data.size);
            }
        });
        itemData.data.holdingSize = holdingAmount;
    }
}