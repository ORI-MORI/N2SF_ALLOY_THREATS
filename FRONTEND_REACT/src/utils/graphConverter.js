export function convertGraphToJSON(nodes, edges) {
    const zones = nodes.filter((n) => n.type === 'zone');
    const systems = nodes.filter((n) => n.type === 'system');

    // Helper to check intersection
    const isInside = (inner, outer) => {
        // Assuming default sizes if not measured yet
        const innerW = inner.width || 100;
        const innerH = inner.height || 100;
        const outerW = outer.width || 200;
        const outerH = outer.height || 200;

        return (
            inner.position.x >= outer.position.x &&
            inner.position.x + innerW <= outer.position.x + outerW &&
            inner.position.y >= outer.position.y &&
            inner.position.y + innerH <= outer.position.y + outerH
        );
    };

    // 1. Map Locations (Zones)
    const locations = zones.map((z, index) => ({
        id: index + 1, // Simple ID generation
        realId: z.id, // Keep track of React Flow ID
        type: z.data.type || 'Internet',
        grade: z.data.grade || 'Open',
    }));

    // 2. Map Systems
    const mappedSystems = systems.map((s, index) => {
        // Find parent zone
        const parentZone = locations.find((loc) => {
            const zoneNode = zones.find((z) => z.id === loc.realId);
            return isInside(s, zoneNode);
        });

        // Default to first location or create a default "Internet" if none found?
        // For now, if no parent, assume ID 1 (or we should warn).
        // Let's default to the first location if available, or 0.
        const locationId = parentZone ? parentZone.id : (locations[0]?.id || 1);

        // Parse stores data (comma separated string -> array of ints)
        const storesStr = s.data.stores || '';
        const stores = storesStr.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));

        return {
            id: index + 100, // Start from 100 to avoid collision
            realId: s.id,
            location: locationId,
            grade: s.data.grade || (parentZone ? parentZone.grade : 'Open'), // Inherit or explicit
            type: s.data.type || 'Server',
            authType: s.data.authType || 'ID_PW', // Default
            stores: stores,
        };
    });

    // 3. Map Connections (Edges)
    const connections = edges.map((e) => {
        const fromSys = mappedSystems.find((s) => s.realId === e.source);
        const toSys = mappedSystems.find((s) => s.realId === e.target);

        if (!fromSys || !toSys) return null;

        // Parse carries data
        const carriesStr = e.data?.carries || '';
        const carries = carriesStr.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));

        return {
            from: fromSys.id,
            to: toSys.id,
            carries: carries,
            protocol: e.data?.protocol || 'HTTP',
            isEncrypted: e.data?.isEncrypted || false,
            hasCDR: e.data?.hasCDR || false,
            realId: e.id
        };
    }).filter(c => c !== null);

    // 4. Collect Data definitions (implicitly from stores/carries)
    // In a real app, we might have a separate Data registry.
    // Here we just need to ensure they exist in the 'data' array if referenced.
    // We'll collect all unique data IDs and create dummy definitions for them.
    const allDataIds = new Set();
    mappedSystems.forEach(s => s.stores.forEach(id => allDataIds.add(id)));
    connections.forEach(c => c.carries.forEach(id => allDataIds.add(id)));

    const dataList = Array.from(allDataIds).map(id => ({
        id: id,
        grade: 'Sensitive', // Default, ideally user defines this too
        description: `Data ${id}`
    }));

    return {
        locations: locations.map(({ realId, ...rest }) => rest),
        systems: mappedSystems.map(({ realId, ...rest }) => rest),
        connections: connections.map(({ realId, ...rest }) => rest),
        data: dataList,
        // Helper mapping to trace back violations
        _mapping: {
            systems: mappedSystems,
            connections: connections
        }
    };
}
