import React from 'react';
import {
  hasAnyMetData,
  hasAnyItem,
  createComponentHashMap,
  prepareMetaData,
  extractComponentTypes,
  extractComponents,
  buildPreference,
  normalizeMetaData
} from './transformer';

describe('transformer', () => {
  console.clear();
  console.clear();
  describe('prepareMetaData', () => {
    const case1 = ['1',
      [{component: 'text-input', items: [], metaData: {}}],
      [{
        component: 'text-input', items: [], metaData: {},
        hasItem: false, hasMetaData: false, cid: 'ab-1', ctid: 'cd-101'
      }]];

    const case2 = ['2',
      [{
        component: 'text-input',
        items: [{component: 'date-input'}],
        metaData: {}
      }],
      [
        {
          component: 'text-input',
          items: [{
            component: 'date-input',
            items: undefined,
            metaData: {},
            hasItem: false,
            hasMetaData: false,
            cid: 'ab-2', ctid: 'cd-102'
          }],
          metaData: {}, hasItem: true, hasMetaData: false, cid: 'ab-1', ctid: 'cd-101'
        }]];

    const case3 = ['3',
      [{
        component: 'text-input',
        items: [{component: 'date-input'}],
        metaData: {a: 1, b: 2}
      }],
      [
        {
          component: 'text-input',
          items: [{
            component: 'date-input',
            items: undefined,
            metaData: {},
            hasItem: false,
            hasMetaData: false,
            cid: 'ab-2', ctid: 'cd-102'
          }],
          metaData: {a: 1, b: 2}, hasItem: true, hasMetaData: true, cid: 'ab-1', ctid: 'cd-101'
        }]];

    const case4 = ['4',
      [{component: 'text-input'}],
      [
        {
          component: 'text-input', items: undefined, metaData: {},
          hasItem: false, hasMetaData: false, cid: 'ab-1', ctid: 'cd-101'
        }]];

    const case5 = ['5',
      [{
        component: 'text-input',
        items: [{component: 'date-input', metaData: {c: 3, d: 4}}],
        metaData: {a: 1, b: 2}
      }],
      [
        {
          component: 'text-input',
          items: [{
            component: 'date-input',
            items: undefined,
            metaData: {c: 3, d: 4},
            hasItem: false,
            hasMetaData: true,
            cid: 'ab-2', ctid: 'cd-102'
          }],
          metaData: {a: 1, b: 2}, hasItem: true, hasMetaData: true, cid: 'ab-1', ctid: 'cd-101'
        }]];

    const case6 = ['6',
      [{
        component: 'text-input', metaData: {a: 1, b: 2},
        items: [
          {
            component: 'date-input', metaData: {c: 3, d: 4},
            items: [
              {component: 'numeric-input'}]
          }],
      }],
      [
        {
          component: 'text-input',
          metaData: {a: 1, b: 2},
          hasItem: true,
          hasMetaData: true,
          cid: 'ab-1',
          ctid: 'cd-101',
          items: [
            {
              component: 'date-input',
              metaData: {c: 3, d: 4},
              hasItem: true,
              hasMetaData: true,
              cid: 'ab-2',
              ctid: 'cd-102',
              items: [
                {
                  component: 'numeric-input',
                  metaData: {},
                  items: undefined,
                  hasItem: false,
                  hasMetaData: false,
                  cid: 'ab-3', ctid: 'cd-103'
                }]
            }]
        }]
    ];

    const cases = [case1, case2, case3, case4, case5, case6];

    it.each(cases)('case %p', (name, input, expected) => {
      const actual = prepareMetaData(input,
        createComponentHashMap('ab-', 0),
        createComponentHashMap('cd-', 100)
      );
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('buildPreference', () => {
    const cases = [
      ['1', [{cid: 'ab-1'}], ['ab-1']],
      ['2', [{cid: 'ab-1', hasItem: true, items: [{cid: 'ab-2'}]}], [{id: 'ab-1', items: ['ab-2']}]],
      ['3', [{cid: 'ab-1', hasItem: true, items: [{cid: 'ab-2'}, {cid: 'ab-3'}]}], [{
        id: 'ab-1',
        items: ['ab-2', 'ab-3']
      }]],
      ['4', [{
        cid: 'ab-1', hasItem: true,
        items: [
          {cid: 'ab-2', items: [{cid: 'ab-3'}], hasItem: true}]
      }],
        [{id: 'ab-1', items: [{id: 'ab-2', items: ['ab-3']}]}]]
    ];

    it.each(cases)('case %p', (name, input, expected) => {
      const actual = buildPreference(input);
      expect(actual).toStrictEqual(expected);

    });
  });
  describe('transformComponents', () => {

    const cases = [
      ['1', [{cid: 'ab-1', component: 'date-input'}],
        expect.objectContaining({
          'ab-1': {
            cid: 'ab-1', componentType: 'date-input', dbid: expect.any(String)
          }
        })],
      ['2', [
        {
          cid: 'ab-1', component: 'date-input', hasItem: true,
          items: [
            {cid: 'ab-2', component: 'numeric-input'}]
        }],
        expect.objectContaining({
          'ab-1': {
            cid: 'ab-1', componentType: 'date-input', dbid: expect.any(String)
          },
          'ab-2': {
            cid: 'ab-2', componentType: 'numeric-input', dbid: expect.any(String)
          }
        })]
    ];

    it.each(cases)('case %p', (name, input, expected) => {
      const actual = extractComponents(input);
      expect(actual).toEqual(expected);
    });
  });
  describe('extractComponentTypes', () => {

    const cases = [
      ['1', [{component: 'date-input', ctid: 'cd-1'}],
        {
          'cd-1': expect.objectContaining({
            dbid: expect.any(String),
            ctid: 'cd-1',
            name: 'date-input'
          })
        }],
      ['2', [{component: 'date-input', ctid: 'cd-1', hasItem: true, items: [{component: 'row', ctid: 'cd-2'}]}],
        expect.objectContaining({
          'cd-1': {dbid: expect.any(String), name: 'date-input', ctid: 'cd-1'},
          'cd-2': {dbid: expect.any(String), name: 'row', ctid: 'cd-2'},
        })]
    ];

    it.each(cases)('case %p', (name, input, expected) => {
      const actual = extractComponentTypes(input);
      expect(actual).toEqual(expected);
    });

  });
  describe('createComponentHashMap', () => {
    const cases = [
      ['component 1', {component: 'text-input'}, 'ab-11'],
      ['component 2', {component: 'date-input'}, 'ab-12'],
      ['another component 1', {component: 'text-input'}, 'ab-11'],
      ['component 3', {}, 'ab-13'],
    ];

    const hashGenerator = createComponentHashMap('ab-', 10);

    it.each(cases)('case %p', (name, input, expected) => {
      const actual = hashGenerator(input);
      expect(actual).toBe(expected);
    });

  });
  describe('hasAnyItem', () => {
    const cases = [
      ['1', null, false],
      ['2', undefined, false],
      ['3', [], false],
      ['4', [1], true],
    ];

    it.each(cases)('case %p', (name, input, expected) => {
      const actual = hasAnyItem(input);
      expect(actual).toBe(expected);
    });

  });
  describe('hasAnyMetData', () => {
    const cases = [
      ['1', null, false],
      ['2', undefined, false],
      ['3', {}, false],
      ['4', {a: 1}, true],
    ];

    it.each(cases)('case %p', (name, input, expected) => {
      const actual = hasAnyMetData(input);
      expect(actual).toBe(expected);
    });

  });
 describe('normalizeMetaData', () => {
   const cases = [
     [1, [{component: 'section', items: [], metaData: {}}],
       { componentList: {
         'cid-101': {componentType: 'section', dbid: 'component.new-id',cid: 'cid-101', ctid: 'ctid-1'}
       }, componentTypeList: {
         'ctid-1': {dbid: 'component-type.next-id', name: 'section', ctid: 'ctid-1'}
       }, preference: ['cid-101']
       }
     ],
     [2, [
       {component: 'section', items: [{component: 'row'}], metaData: {}}],
       { componentList: {
           'cid-101': {componentType: 'section', dbid: 'component.new-id',cid: 'cid-101',ctid: 'ctid-1'},
           'cid-102': {componentType: 'row', dbid: 'component.new-id',cid: 'cid-102', ctid: 'ctid-2'}
         }, componentTypeList: {
           'ctid-1': {dbid: 'component-type.next-id', name: 'section', ctid: 'ctid-1'},
           'ctid-2': {dbid: 'component-type.next-id', name: 'row' ,ctid: 'ctid-2'},
         }, preference: [{id: 'cid-101', items: ['cid-102']}]
       }
     ],
    [3, {component: 'section', items: [], metaData: {}},
       { componentList: {
           'cid-101': {componentType: 'section',dbid: 'component.new-id',cid: 'cid-101', ctid: 'ctid-1'}
         }, componentTypeList: {
           'ctid-1': {dbid: 'component-type.next-id', name: 'section', ctid: 'ctid-1'}
         }, preference: 'cid-101'
       }
     ],
     [4, {component: 'section', items: [{component: 'row'}], metaData: {}},
       { componentList: {
           'cid-101': {componentType: 'section', dbid: 'component.new-id',cid: 'cid-101', ctid: 'ctid-1'},
           'cid-102': {componentType: 'row', dbid: 'component.new-id',cid: 'cid-102', ctid: 'ctid-2'}
         }, componentTypeList: {
           'ctid-1': {dbid: 'component-type.next-id', name: 'section', ctid: 'ctid-1'},
           'ctid-2': {dbid: 'component-type.next-id', name: 'row', ctid: 'ctid-2'},
         }, preference: {id: 'cid-101', items: ['cid-102']}
       }
     ],
     [5, [{component: 'section', items: [{component: 'row'}], metaData: {header: 'Account Info'}}],
       { componentList: {
           'cid-101': {componentType: 'section', dbid: 'component.new-id',cid: 'cid-101', ctid: 'ctid-1', profileValue: '{"header":"Account Info"}'},
           'cid-102': {componentType: 'row', dbid: 'component.new-id',cid: 'cid-102', ctid: 'ctid-2'}
         }, componentTypeList: {
           'ctid-1': {dbid: 'component-type.next-id', name: 'section', ctid: 'ctid-1'},
           'ctid-2': {dbid: 'component-type.next-id', name: 'row', ctid: 'ctid-2'},

         }, preference: [{id: 'cid-101', items: ['cid-102']}]
       }
     ],
      [6, [{component: 'section', items: [{component: 'row', metaData: {colSize: 4}}], metaData: {header: 'Account Info'}}],
       { componentList: {
           'cid-101': {componentType: 'section', dbid: 'component.new-id',cid: 'cid-101', ctid: 'ctid-1', profileValue: '{"header":"Account Info"}'},
           'cid-102': {componentType: 'row', dbid: 'component.new-id',cid: 'cid-102',  ctid: 'ctid-2',profileValue: '{"colSize":4}'}
         }, componentTypeList: {
           'ctid-1': {dbid: 'component-type.next-id', name: 'section', ctid: 'ctid-1'},
           'ctid-2': {dbid: 'component-type.next-id', name: 'row', ctid: 'ctid-2'},

         }, preference: [{id: 'cid-101', items: ['cid-102']}]
       }
     ],
     [7, [{component: 'section', items: [
         {component: 'row', items: [{component: 'column'},{component: 'column'}]}]}],
       { componentList: {
           'cid-101': {componentType: 'section', dbid: 'component.new-id',cid: 'cid-101', ctid: 'ctid-1'},
           'cid-102': {componentType: 'row', dbid: 'component.new-id',cid: 'cid-102', ctid: 'ctid-2'},
           'cid-103': {componentType: 'column', dbid: 'component.new-id',cid: 'cid-103', ctid: 'ctid-3'}
         }, componentTypeList: {
           'ctid-1': {dbid: 'component-type.next-id', name: 'section', ctid: 'ctid-1'},
           'ctid-2': {dbid: 'component-type.next-id', name: 'row', ctid: 'ctid-2'},
           'ctid-3': {dbid: 'component-type.next-id', name: 'column', ctid: 'ctid-3'},

         }, preference: [{id: 'cid-101', items: [{id:'cid-102', items: ['cid-103', 'cid-103']}]}]
       }
     ],
   ];

   it.each(cases)('case %p', (name, input, expected) => {
     const actual = normalizeMetaData(input, {prefix:'cid-', seed: 100},
       {prefix: 'ctid-', seed: 0});
     expect(actual).toEqual(expected);

   });
 });

});