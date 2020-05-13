import {
    RYUU
} from "../config.js";

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

        this._prepareItemData(itemData, actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareItemData(itemData, actorData) {
        const data = itemData.data;
        if (RYUU.STORAGE.includes(itemData.type)) {
            if (actorData._id === undefined) {
                data.holding = [];
                return
            };

            const holding = data.holding;
            let holdingAmount = 0;

            holding.forEach(item => {
                const heldItem = actorData.items.find(i => i._id === item.id);
                if (heldItem) {
                    holdingAmount += Number(heldItem.data.size);
                }
            });
            itemData.data.holdingSize = holdingAmount;
        }
    }
}