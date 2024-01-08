import React, { useEffect, useRef } from 'react';
import './table.scss'
import { PositionContext } from './positionContext';



const Table = () => {

    return (
        <div className="game-page__table" id = "game-table">
            <div className="table__rail"></div>
            <div className="table__felt"></div>
        </div>
    );
};

export default Table;

