import React, { useEffect, useRef, forwardRef } from 'react';
import './table.scss'
import {usePositionContext} from './positionContext';

interface TableProps {

}

const Table = forwardRef<HTMLDivElement, TableProps>((prob, ref) => {
    const tableRef = useRef<HTMLDivElement>(null);
    const position = usePositionContext();

    return (
        <div className="game-page__table" ref={tableRef}>
            <div className="table__rail"></div>
            <div className="table__felt"></div>
        </div>
    );
});

export default Table;

