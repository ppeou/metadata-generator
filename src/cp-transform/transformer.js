import termsheetConfig from './json/config1.json';
import orderbookConfig from './json/config1.json';

const hasAnyMetData = (metaData) => {
  return Object.keys(metaData || {}).length > 0;
};

const hasAnyItem = (Items) => {
  return (Items || []).length > 0;
};

const hashMethodForComponent = ({component, metaData}) => {
  const hash = (Object.keys(metaData || {}) || [])
    .sort().map(k => `[${k}:${metaData[k]}]`)
    .join(',');
  return `${component} = ${hash}`;
};
const hashMethodForComponentType = ({component}) => component;

const createComponentHashMap = (prefix = 'iid-', idx = 0, hashMethod) => {
  const componentIdMap = {};
  window[prefix] = componentIdMap;
  if (!idx) {
    idx = 0;
  }
  const getComponentHash = (value) => {
    const key = hashMethod(value);
    if (!componentIdMap[key]) {
      componentIdMap[key] = `${prefix}${(++idx)}`;
    }

    return componentIdMap[key];
  };
  return getComponentHash;
}

const [componentField, itemsField, metaDataField] = ['component', 'items', 'metaData'];

const prepareMetaData = (metadata, componentHashGenerator, componentTypeHashGenerator) => {
  return metadata.map(comp => {
    const {component, items: oItems, metaData} = comp;
    const cid = componentHashGenerator(comp);
    const ctid = componentTypeHashGenerator(comp);
    const hasItem = hasAnyItem(oItems);
    const hasMetaData = hasAnyMetData(metaData);
    let items = hasItem ? oItems.map(b => prepareMetaData([b], componentHashGenerator, componentTypeHashGenerator)[0]) : oItems;

    return {
      cid, ctid, component,
      hasItem, hasMetaData,
      items,
      metaData: {...metaData},

    };
  });
}

const extractComponentTypes = (metaData, componentTypeList = {}) => {
  metaData.forEach(comp => {
    const {component: name, hasItem, items, ctid} = comp;

    if (!componentTypeList[ctid]) {
      componentTypeList[ctid] = {
        dbid: 'component-type.next-id',
        ctid,
        name,
      };
    }

    hasItem && (extractComponentTypes(items, componentTypeList));

  });
  return componentTypeList;
};

const extractComponents = (metaData, componentList = {}) => {
  metaData.forEach(comp => {
    const {
      cid, ctid, component: componentType, items,
      metaData, hasMetaData, hasItem
    } = comp;
    const newComp = {
      dbid: 'component.new-id',
      cid, ctid,
      componentType,
    };
    if (hasMetaData) {
      newComp.profileValue = JSON.stringify(metaData);
    }
    componentList[cid] = newComp;

    if (hasItem) {
      extractComponents(items, componentList);
    }
  });
  return componentList;
};

const buildPreference = (metadata) => {
  return metadata.reduce((p, comp) => {
    const {cid, hasItem, items: oItems} = comp;

    if (!hasItem) {
      p.push(cid);
    } else {
      const items = buildPreference(oItems)
      p.push({id: cid, items});
    }
    return p;
  }, []);
}

const normalizeMetaData = (_data,
                           componentPrefix = {prefix: 'FI-TS-C-1-', seed: 0},
                           componentTypePrefix = {prefix: 'FI-TS-CT-1-', seed: 0}) => {
  let data = _data;
  let undoArray = false;

  if (!Array.isArray(data)) {
    data = [data];
    undoArray = true;
  }

  const componentHashGenerator = createComponentHashMap(componentPrefix.prefix, componentPrefix.seed, hashMethodForComponent);
  const componentTypeHashGenerator = createComponentHashMap(componentTypePrefix.prefix, componentTypePrefix.seed, hashMethodForComponentType);
  const nData = prepareMetaData(data, componentHashGenerator, componentTypeHashGenerator);
  const componentTypeList = extractComponentTypes(nData);
  const componentList = extractComponents(nData);
  const preference = buildPreference(nData, componentList, componentTypeList);

  return {
    componentTypeList,
    componentList,
    preference: undoArray ? preference[0] : preference
  };
};

const a = normalizeMetaData(termsheetConfig,
  {prefix: 'fi-tc-dt-c-', seed: 100},
  {prefix: 'fi-tc-dt-ct-', seed: 200});
console.log(a);

/*const b = normalizeMetaData(orderbookConfig,
  {prefix: 'fi-ob-c-', seed: 10},
  {prefix: 'fi-ob-ct-', seed: 20});
console.log(b);*/

export {
  hasAnyMetData, hasAnyItem, createComponentHashMap,
  prepareMetaData,
  extractComponentTypes,
  extractComponents,
  buildPreference,
  normalizeMetaData
};