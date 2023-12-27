import React, { useEffect, useRef } from 'react';
import './table.scss'
import useRectangleContext from './rectangleContext';

const Table: React.FC = () => {
    const tableRef = useRef<HTMLDivElement>(null);
    const { rectangle, setRectangle } = useRectangleContext();

    useEffect(() => {
        // 函数用于更新表格尺寸和位置信息
        const updateTableDimensions = () => {
            const tableElement = tableRef.current;

            if (tableElement) {
                const prob = tableElement.getBoundingClientRect();
                const x = prob.x;
                const y = prob.y;
                const width = prob.width;
                const height = prob.height;
                setRectangle({ x,y,width, height });
            }
        };

        // 在组件挂载后和窗口大小变化时执行更新
        updateTableDimensions();
        window.addEventListener('resize', updateTableDimensions);

        // 在组件卸载时清除事件监听器
        return () => {
            window.removeEventListener('resize', updateTableDimensions);
        };
    }, []); // 依赖数组为空，表示只在组件挂载和卸载时执行

    return (
        // <div className="game-page__table" >
        <div className="game-page__table" ref={tableRef}>
            <div className="table__rail"></div>
            <div className="table__felt"></div>
        </div>
    );
};

export default Table;

