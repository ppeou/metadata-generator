SET SERVEROUTPUT ON;
SET AUTOCOMMIT OFF;

DECLARE
    TYPE stringArr IS TABLE OF VARCHAR2(50);
    TYPE map_varchar IS TABLE OF NUMBER INDEX BY VARCHAR2 (50);
    componentTypes  stringArr;
    components      stringArr;
    componentTypeId map_varchar;
    componentId     map_varchar;
    str             VARCHAR2(50);
    toBeDeleteCompTypeName VARCHAR2(4000);
    toBeDeleteCompName VARCHAR2(4000);
    sqlStr VARCHAR2(4000);
BEGIN

    DBMS_OUTPUT.PUT_LINE('Starting Data Insert:');

    components := stringArr('fi-db-c-101', 'comp-number', 'comp-date');
    componentTypes := stringArr('fi-db-ct-201', 'number', 'date');

    DBMS_OUTPUT.PUT_LINE('--Getting ID for ComponentTypes:');
    FOR idx IN componentTypes.FIRST..componentTypes.LAST
        LOOP
            str := componentTypes(idx);
            toBeDeleteCompTypeName := toBeDeleteCompTypeName || ',''' || str || '''';
            componentTypeId(str) := COMPONENT_TYPE_ID.nextval; --componentTypeId('text') = 1;
            DBMS_OUTPUT.PUT_LINE('----' || str || ': ' || componentTypeId(str));
        END LOOP;
    toBeDeleteCompTypeName := SUBSTR(toBeDeleteCompTypeName, 2);

    DBMS_OUTPUT.PUT_LINE('--Getting ID for Components:');
    FOR idx IN components.FIRST..componentTypes.LAST
        LOOP
            str := components(idx);
            toBeDeleteCompName := toBeDeleteCompName || ',''' || str || '''';
            componentId(str) := COMPONENT_ID.nextval;
            DBMS_OUTPUT.PUT_LINE('----' || str || ': ' || componentId(str));
        END LOOP;
    toBeDeleteCompName := SUBSTR(toBeDeleteCompName, 2);
    SAVEPOINT start_of_transaction;

    DBMS_OUTPUT.PUT_LINE('--Deleting Components:' || toBeDeleteCompName);
    sqlStr := 'DELETE FROM COMPONENT WHERE NAME IN (' || toBeDeleteCompName || ')';
    EXECUTE IMMEDIATE sqlStr;
    DBMS_OUTPUT.PUT_LINE('----' || SQL%ROWCOUNT  || ' effected');

    DBMS_OUTPUT.PUT_LINE('--Deleting ComponentTypes:' || toBeDeleteCompTypeName);
    sqlStr := 'DELETE FROM COMPONENT_TYPE WHERE NAME IN (' || toBeDeleteCompTypeName || ')';
    EXECUTE IMMEDIATE sqlStr;
    DBMS_OUTPUT.PUT_LINE('----' || SQL%ROWCOUNT  || ' effected');

    DBMS_OUTPUT.PUT_LINE('--Inserting ComponentTypes:');
    insert into COMPONENT_TYPE(id, name) values (componentTypeId('text'), 'text');
    insert into COMPONENT_TYPE(id, name) values (componentTypeId('number'), 'number');
    insert into COMPONENT_TYPE(id, name) values (componentTypeId('date'), 'date');

    DBMS_OUTPUT.PUT_LINE('--Inserting Components:');
    insert into COMPONENT(id, name, type, profileValue) VALUES (componentId('comp-text'), 'comp-text',
                                                  componentTypeId('text'), '{"label":"Profile Page"}');
    insert into COMPONENT(id, name, type) VALUES (componentId('comp-number'), 'comp-number', componentTypeId('number'));
    insert into COMPONENT(id, name, type) VALUES (componentId('comp-date'), 'comp-date', componentTypeId('date'));

    COMMIT COMMENT 'insert into components and component-types tables';
    DBMS_OUTPUT.PUT_LINE('-done');

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('*** Error occurred');
        RAISE;
END;
/