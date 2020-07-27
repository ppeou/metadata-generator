import {flow} from 'lodash';

/*const schema1 = {
  schema: 'MYDB',
  tableName: 'TABLE-1',
  columns: [
    {field: 'field1', column: 'cola'},
    {field: 'field2', column: 'colb'},
    {field: 'field3', column: 'colc', getter: () => 'lala'}
  ]
};*/

const generateGetters = () => {
  const maps = {};

  const NULL = 'NULL';
  const withQuote = a => a !== NULL ? `'${a}'` : NULL;
  const withNull = a => a ? a : NULL;
  const withGetter = fn => (data) => fn(data);

  return ({getterFn, useNull, useQuote}) => {
    const token = [getterFn, useNull, useQuote];
    if (!maps[token]) {
      const fns = [];
      getterFn && fns.push(withGetter(getterFn));
      useNull && fns.push(withNull);
      useQuote && fns.push(withQuote);

      maps[token] = flow(...fns);
    }
    return maps[token];
  }
};

const createSchemaExecutor = (input = {}) => {
  const {schema, tableName, columns} = input;
  const dynamicGetters = generateGetters();
  const columnTracker = {};
  const filteredColumns = columns.filter(({column}) => {
    if(!columnTracker[column]) {
      columnTracker[column] = true;
      return true;
    } else {
      return false;
    }
  });
  const {columnList, destructureList, valueList, getterMap} =
    filteredColumns.reduce(({columnList, destructureList, valueList, getterMap},
                            {field, column, useStaticValue, useNull, useQuote}) => {

          columnList.push(column);
          if (useStaticValue) {
            valueList.push(useStaticValue);
          } else {
            destructureList.push(field);
            valueList.push(`\${${field}}`);
            if (useNull || useQuote) {
              getterMap[field] = dynamicGetters({useNull, useQuote});
            }
          }

        return {columnList, destructureList, valueList, getterMap};
      },
      {columnList: [], valueList: [], destructureList: [], getterMap: {}});

  const param1 = `{${destructureList.join(',')}}`;
  const param2 = ['return `',
    `INSERT INTO ${schema}.${tableName}`,
    `(${columnList.join(',')})`,
    ' VALUES ',
    `(${valueList.join(',')});`,
    '`;'
  ].join('');

  const abc = (data) => Object.keys(getterMap || {}).reduce((p,field) => (p[field] = getterMap[field](data[field])) && p, {...data});

  return {
    sqlGenerator: new Function(param1, param2),
    transformer: abc
  };
};

export {
  generateGetters,
  createSchemaExecutor
};