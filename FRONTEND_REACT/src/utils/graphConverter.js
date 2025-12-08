export function convertGraphToJSON(nodes, edges) {
    const zones = nodes.filter((n) => n.type === 'zone');
    const systems = nodes.filter((n) => n.type === 'system');

    // Helper to check intersection
    const isInside = (inner, outer) => {
        const innerW = inner.width || inner.measured?.width || 150;
        const innerH = inner.height || inner.measured?.height || 150;
        const outerW = outer.width || outer.measured?.width || 300;
        const outerH = outer.height || outer.measured?.height || 300;

        return (
            inner.position.x >= outer.position.x &&
            inner.position.x + innerW <= outer.position.x + outerW &&
            inner.position.y >= outer.position.y &&
            inner.position.y + innerH <= outer.position.y + outerH
        );
    };

    // Helper to sanitize IDs for Alloy (alphanumeric only)
    const sanitizeId = (id) => {
        if (!id) return 'unknown';
        return id.toString().replace(/[^a-zA-Z0-9]/g, '_');
    };

    // 1. Map Locations (Zones)
    let locations = zones.map((z) => ({
        id: sanitizeId(z.id),
        realId: z.id,
        type: z.data.type || 'Internet',
        grade: z.data.grade || 'Open',
    }));

    // If no zones exist, create a default Internet zone
    if (locations.length === 0) {
        locations.push({
            id: 'default_internet',
            realId: 'default-internet',
            type: 'Internet',
            grade: 'Open'
        });
    }

    // 2. Map Systems
    const mappedSystems = systems.map((s) => {
        let parentZone = null;
        const data = s.data || {};

        // 1. Check for manual override
        if (data.loc) {
            parentZone = locations.find(l => l.realId === data.loc);
        }

        // 2. Fallback to spatial detection
        if (!parentZone) {
            parentZone = locations.find((loc) => {
                const zoneNode = zones.find((z) => z.id === loc.realId);
                if (!zoneNode) return false;
                return isInside(s, zoneNode);
            });
        }

        const locationId = parentZone ? parentZone.id : (locations[0]?.id || 'default_internet');

        // Parse stored data: Support both 'storedData' (Objects) and 'stores' (IDs)
        let storesIds = [];
        if (data.storedData && Array.isArray(data.storedData)) {
            storesIds = data.storedData.map(d => sanitizeId(d.id));
        } else if (data.stores && Array.isArray(data.stores)) {
            storesIds = data.stores.map(id => sanitizeId(id));
        }

        return {
            ...data,
            id: sanitizeId(s.id),
            realId: s.id,
            loc: locationId,
            grade: data.grade || (parentZone ? parentZone.grade : 'Open'),
            type: data.type || 'Terminal',

            isCDS: data.isCDS === true,
            authType: data.authType || 'Single',
            isRegistered: data.isRegistered === true,
            isStorageEncrypted: data.isStorageEncrypted === true,
            isManagement: data.isManagement === true,
            isolation: data.isolation || 'None',
            hasMDM: data.hasMDM === true,

            // New Security Properties (Explicit Mapping)
            patchStatus: data.patchStatus || 'UpToDate',
            lifeCycle: data.lifeCycle || 'Active',
            hasAuditLogging: data.hasAuditLogging === true,
            hasSecureClock: data.hasSecureClock === true,
            sessionPolicy: data.sessionPolicy || 'Unsafe',

            stores: storesIds,
            _storedDataObjects: data.storedData || [], // Keep for data collection
        };
    });

    // 3. Map Connections (Edges)
    const connections = edges.flatMap((e, index) => {
        const fromSys = mappedSystems.find((s) => s.realId === e.source);
        const toSys = mappedSystems.find((s) => s.realId === e.target);
        const data = e.data || {};

        if (!fromSys || !toSys) return [];

        // Parse carries data
        const carriesStr = data.carries || [];
        let carries = [];

        if (Array.isArray(carriesStr)) {
            carries = carriesStr.map(x => sanitizeId(x));
        } else if (typeof carriesStr === 'string' && carriesStr.trim() !== '') {
            carries = carriesStr.split(',').map(x => sanitizeId(x.trim()));
        }

        const baseId = sanitizeId(e.id);
        const isBidirectional = data.isBidirectional !== false;

        const forwardConnection = {
            ...data,
            id: baseId,
            from: fromSys.id,
            to: toSys.id,
            carries: carries,
            protocol: data.protocol || 'HTTPS',
            isEncrypted: data.isEncrypted === true,
            hasCDR: data.hasCDR === true,
            hasDLP: data.hasDLP === true,
            hasAntiVirus: data.hasAntiVirus === true,
            realId: e.id,
        };

        if (isBidirectional) {
            const backwardConnection = {
                ...forwardConnection,
                id: baseId + '_return',
                from: toSys.id,
                to: fromSys.id,
                realId: e.id,
            };
            return [forwardConnection, backwardConnection];
        }

        return [forwardConnection];
    });

    // 4. Collect Data definitions
    const allDataMap = new Map();

    // From Systems (storedData objects)
    mappedSystems.forEach(s => {
        if (s._storedDataObjects) {
            s._storedDataObjects.forEach(d => {
                const sId = sanitizeId(d.id);
                if (!allDataMap.has(sId)) {
                    allDataMap.set(sId, {
                        id: sId,
                        grade: d.grade || 'Sensitive',
                        fileType: d.fileType || 'Document'
                    });
                }
            });
        }
    });

    // From Presets (we might need to infer data properties if only IDs are present)
    // Ideally, presets should include a 'data' section defining these assets.
    // If not, we fallback to defaults.

    // Check 'stores' and 'carries' for any IDs not yet defined
    const registerDataId = (id) => {
        const sId = sanitizeId(id);
        if (!allDataMap.has(sId)) {
            allDataMap.set(sId, {
                id: sId,
                grade: 'Sensitive', // Default
                fileType: 'Document' // Default
            });
        }
    };

    mappedSystems.forEach(s => s.stores.forEach(registerDataId));
    connections.forEach(c => c.carries.forEach(registerDataId));

    // If the input JSON (from preset) has a 'data' array, use it to enrich definitions
    // But convertGraphToJSON only takes nodes/edges. 
    // We assume the nodes/edges contain all necessary info or we use defaults.
    // *Correction*: The preset loader should populate the nodes with full data objects.

    const dataList = Array.from(allDataMap.values());

    return {
        locations: locations.map(({ realId, ...rest }) => rest),
        systems: mappedSystems.map(({ realId, _storedDataObjects, ...rest }) => rest),
        connections: connections.map(({ realId, ...rest }) => rest),
        data: dataList,
        _mapping: {
            systems: mappedSystems,
            connections: connections
        }
    };
}
