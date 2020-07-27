import React from 'react';
import json from './normalized-data.json';
import {
  createSchemaExecutor,
  generateGetters
} from './tosql';

describe('tosql', () => {
  console.clear();
  console.clear();

  describe('generateGetters', () => {
    const [useNull, useQuote] = [true, true];
    const generateFlags = (a, b, c) => ({getterFn: a, useNull:b, useQuote: c});
    const cases = [
      ['1', generateFlags((a) => a.name), {name: 'sam'}, 'sam'],
      ['2', generateFlags(undefined, useNull), null, 'NULL'],
      ['3', generateFlags(undefined, useNull), 'a', 'a'],
      ['4', generateFlags(undefined, undefined, useQuote), 'b', `'b'`],
      ['5', generateFlags((a) => a.name, useNull, useQuote), {name: 'sam'}, `'sam'`],
      ['6', generateFlags((a) => a.name, useNull, useQuote), {email: 'sam'}, 'NULL'],
      ['7', generateFlags((a) => a.email, useNull, useQuote), {name: 'sam'}, 'NULL'],
    ];

    const getter = generateGetters();

    it.each(cases)('case %p', (name, flags, input, expected) => {
      const fn = getter(flags);
      const actual = fn(input);
      expect(actual).toBe(expected);
    });

  });

  describe('createSchemaExecutor', () => {
    const schema1 = {
      schema: 'MYDB',
      tableName: 'TABLE1',
      columns: [
        {column: 'iid', useStaticValue: 'NEXTVAL'},
        {column: 'id', field: 'rowId'},
        {column: 'name', field: 'userName', useQuote: true, useNull: true},
        {column: 'email', field: 'userEmail', useQuote: true, useNull: true},
        {column: 'dob', field: 'userDOB', useQuote: true, useNull: true},
        {column: 'CBY', useStaticValue: 'SYSTEM'},
        {column: 'CON', useStaticValue: 'SYSDATE'},
        {column: 'UBY', useStaticValue: 'SYSTEM'},
        {column: 'UON', useStaticValue: 'SYSDATE'},
      ]
    };
    const data1 = {rowId: 1, userName: 'Abc'};
    const data2 = {rowId: 1, userName: 'Abc', userEmail: 'a@b', userDOB:'01-Jan-20'};
    const case1 = ['1', data1,
        "INSERT INTO MYDB.TABLE1(iid,id,name,email,dob,CBY,CON,UBY,UON) VALUES "
        +"(NEXTVAL,1,'Abc',NULL,NULL,SYSTEM,SYSDATE,SYSTEM,SYSDATE);"];

    const case2 = ['2', data2,
      "INSERT INTO MYDB.TABLE1(iid,id,name,email,dob,CBY,CON,UBY,UON) VALUES "
      +"(NEXTVAL,1,'Abc','a@b','01-Jan-20',SYSTEM,SYSDATE,SYSTEM,SYSDATE);"];

    const cases = [case1,case2];

    it.each(cases)('case %p', (name, input, expected) => {
      const {sqlGenerator, transformer} = createSchemaExecutor(schema1);
      const actual = sqlGenerator(transformer(input));
      expect(sqlGenerator).toBeInstanceOf(Function);
      expect(actual).toBe(expected);
    });

  });

  describe('componentTypeListToInsert', () => {
    const {componentTypeList} = json;
    const schema = {
      schema: 'MYDB',
      tableName: 'CT',
      columns: [
        {column: 'id', useStaticValue: 'MYSEQ.NEXTVAL'},
        {column: 'name', field: 'ctid', useQuote: true, useNull: true},
        {column: 'CBY', useStaticValue: "'SYSTEM'"},
        {column: 'CON', useStaticValue: 'SYSDATE'},
        {column: 'UBY', useStaticValue: "'SYSTEM'"},
        {column: 'UON', useStaticValue: 'SYSDATE'},
      ]
    };

    const {sqlGenerator, transformer} = createSchemaExecutor(schema);

    it('case %p', () => {
      const items = Object.keys(componentTypeList).map(k => sqlGenerator(transformer(componentTypeList[k])));
      console.log(items.join('\n'));
      expect(12).toBe(2+10);
    });

  });

  describe('componentList', () => {
    const {componentList: items} = json;
    //ID, NAME, PROFILE_VALUE, LABEL, COMPONENT_TYPE, APP_NAME
    const schema = {
      schema: 'MYDB',
      tableName: 'COMPONENT',
      columns: [
        {column: 'ID', useStaticValue: 'MYSEQ.NEXTVAL'},
        {column: 'NAME', field: 'cid', useQuote: true, useNull: true},
        {column: 'PROFILE_VALUE', field: 'profileValue', useQuote: true, useNull: true},
        {column: 'LABEL', field: 'label', useQuote: true, useNull: true},
        {column: 'COMPONENT_TYPE', field: 'componentType', useQuote: true, useNull: true},
        {column: 'APP_NAME', useStaticValue: "'APP-1'"},
        {column: 'CBY', useStaticValue: "'SYSTEM'"},
        {column: 'CON', useStaticValue: 'SYSDATE'},
        {column: 'UBY', useStaticValue: "'SYSTEM'"},
        {column: 'UON', useStaticValue: 'SYSDATE'},
      ]
    };

    const {sqlGenerator, transformer} = createSchemaExecutor(schema);

    it('case %p', () => {
      const sql = Object.keys(items).map(k => sqlGenerator(transformer(items[k])));
      console.log(sql.join('\n'));
      expect(12).toBe(2+10);
    });

  });

  describe.only('Preference', () => {
    const {preference} = json;
    const items = {1: {profileName: 'TS-Default', profileValue: JSON.stringify(preference)}};
    //ID, PROFILE_NAME, PROFILE_VALUE, PROFILE_TYPE_ID, CONTAINER_TYPE
    const schema = {
      schema: 'MYDB',
      tableName: 'PREF',
      columns: [
        {column: 'ID', useStaticValue: 'MYSEQ.NEXTVAL'},
        {column: 'PROFILE_NAME', field: 'profileName', useQuote: true, useNull: true},
        {column: 'PROFILE_VALUE', field: 'profileValue', useQuote: true, useNull: true},
        {column: 'CONTAINER_TYPE', useStaticValue: '101'},
        {column: 'CBY', useStaticValue: "'SYSTEM'"},
        {column: 'CON', useStaticValue: 'SYSDATE'},
        {column: 'UBY', useStaticValue: "'SYSTEM'"},
        {column: 'UON', useStaticValue: 'SYSDATE'},
      ]
    };

    const {sqlGenerator, transformer} = createSchemaExecutor(schema);

    it('case %p', () => {
      const sql = Object.keys(items).map(k => sqlGenerator(transformer(items[k])));
      console.log(sql.join('\n'));
      expect(12).toBe(2+10);
    });

  });
});