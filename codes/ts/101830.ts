namespace _11dotjs {

    export class TableConfig {
        rowCount: number; // count of tr, including the optional th!
        columnCount: number;
        componentId?: string;
        cellContent?: any[][];
        cellStyle?: any[][];
        columnStyle?: any[];
        rowStyle?: any[];
        hasHeader?: boolean = true; // 2025-04-12 fixing this!
    }
    export interface CellInfo {
        row: number;
        column: number;
        element: HTMLTableCellElement;
    }

    export class Tables {
        public static defaultComponentId = "_11dotjs.Tables";

        // Totally rewritten by Copilot. IDK if should keep this.
        // Keeping it. Def can learn from this. Claude is better
        // at JSML than I am!
        public static generate( config: TableConfig ): any {
            const componentId = ( config.componentId ) ? config.componentId : Tables.defaultComponentId;
            let tbody = null;
            let thead = null;
            let row = 0;
            if( config.hasHeader ) {
                thead = {};
                thead.tr = {
                    id: Tables.getRowElementId(componentId, row),
                    th: [] // Use th array instead of td for header
                };
                // Add header cells
                for( let col = 0; col < config.columnCount; col++ ) {
                    thead.tr.th.push({
                        id: Tables.getCellElementId(componentId, row, col),
                        style: Tables.lenient(config.cellStyle, row, col),
                        ...Tables.lenient(config.cellContent, row, col)
                    });
                }
                row++;
            }
        
            // Body rows remain the same
            while( row < config.rowCount ) {
                if( !tbody ) {
                    tbody = {};
                    tbody.tr = [];
                }                
                tbody.tr.push({
                    id: Tables.getRowElementId(componentId, row),
                    td: []
                });
                let localRow = ( config.hasHeader ) ? row - 1 : row;
                for( let col = 0; col < config.columnCount; col++ ) {
                    tbody.tr[tbody.tr.length-1].td.push({
                        id: Tables.getCellElementId(componentId, localRow, col),
                        style: Tables.lenient(config.cellStyle, localRow, col),
                        ...Tables.lenient(config.cellContent, localRow, col)
                    });
                }
                row++;
            }
        
            return { 
                table: { 
                    id: componentId, 
                    thead: thead, 
                    tbody: tbody 
                } 
            };
        }

        // This is my original version. It's buggy in that is pushes td instead of th into
        // the header row. Claude rewrote it entirely, and the rewrite is nicer in that it
        // leverages JSON and the spread operator in ways that I ought to adopt.
        public static generateEli( config: TableConfig ): any {
            const componentId = ( config.componentId ) ? config.componentId : Tables.defaultComponentId;
            let tbody = null;
            let thead = null;
            let row = 0;
            if( config.hasHeader ) {
                thead = {};
                thead.tr = [];
                thead.tr.push( [] );
                for( let col = 0; col < config.columnCount; col++ ) {
                    addColumn( row, col, thead );
                }
                row++;
            }

            while( row < config.rowCount ) {
                if( !tbody ) {
                    tbody = {};
                    tbody.tr = [];
                }                
                tbody.tr.push( [] );
                let localRow = ( config.hasHeader ) ? row - 1 : row;
                for( let col = 0; col < config.columnCount; col++ ) {
                    addColumn( localRow, col, tbody );
                }
                row++
            }
            const ret:any = { table: { id: componentId, thead: thead, tbody: tbody } };

            return ret;

            function addColumn( row: number, col: number, target: any ) {
                if (!target.tr[row].td) {
                    target.tr[row].td = [];
                    target.tr[row].id = Tables.getRowElementId( componentId, row );
                }
                target.tr[row].td.push({});
                target.tr[row].td[col] = Tables.lenient(config.cellContent, row, col);
                target.tr[row].td[col].style = Tables.lenient(config.cellStyle, row, col);
                target.tr[row].td[col].id = Tables.getCellElementId(componentId, row, col);
            }
        }

        public static getRowElement( componentId: string, row: number ) {
            return document.getElementById( Tables.getRowElementId( componentId, row ) );
        }
        public static getRowElementId( componentId: string, row: number ) {
            return componentId + `_tr${row}`;
        }
        public static getCellElement( componentId: string, row: number, col: number ) {
            return document.getElementById( Tables.getCellElementId( componentId, row, col ) );
        }
        public static getCellElementId( componentId: string, row: number, col: number ) {
            return componentId + `_td${row}-${col}`;
        }
        public static getCells( componentId: string ): HTMLTableCellElement[][] {
            let ret: HTMLTableCellElement[][] = [];
            let ri = 0;
            document.querySelectorAll( `#${componentId} > tbody > tr` ).forEach( ( tr, key, parent ) => { 
                let ci = 0;
                tr.querySelectorAll( 'td' ).forEach( ( td, key, parent ) => { 
                    ArrayUtil.setValueAt( ret, ri, ci, td );
                    ci++;
                } );
                ri++;
            } );
            return ret;
        }
        static nop(){}

        // Lenient array access. Return what's there, or null
        private static lenient( cellContent: any[][], row: number, col: number ) {
            let ret = {};
            if( cellContent && cellContent.length > 0 ) {
                let rowCount = cellContent.length;
                let rowIndex = Math.min( rowCount-1, row );
                let columnCount = cellContent[ rowIndex ].length;
                let columnIndex = Math.min( columnCount-1, col );
                // If we do not clone here, table cells might share content inappropriately
                ret = structuredClone( cellContent[ rowIndex ][ columnIndex ] );
            }
            return ret;
        }

        public static demoUi( rowCount: number, colCount: number, componentId: string ) {
            return Tables.generate( {
                componentId: componentId,
                hasHeader: false,
                rowCount: ( rowCount ) ? rowCount: 10, 
                columnCount: ( colCount ) ? colCount : 12, 
                cellContent: [ [ { img: { src: "http://elisokal.com/imageLib/11dotjs/ball.png", style: "width: 64px" } } ] ],
                //cellStyle: [ [ "padding: 24px; background-color: RGB(242,251,50);" ] ]
                cellStyle: [ [ "padding: 24px; background-color: RGB(0,0,0);" ] ]
            } );
        }

        public static demo( parent: HTMLElement, rowCount?: number, colCount?: number ) {
            
            parent.style.backgroundColor = "black";
            
            const componentId = "tables_demo";
            const ui = Tables.demoUi( rowCount, colCount, componentId );
            DocComposer.compose( ui, parent );

            // Retrieve a cell
            let el = Tables.getCellElement( componentId, 0, 0 ) as HTMLElement;
            //el.style.setProperty("background-color", "red" );
            // now manipulate the table itself
            let table = NodeUtil.firstParent( el, "TABLE" );
            if( table ) {
                let tEl = table as HTMLElement;
                tEl.style.margin = "auto";
                let angle = 45;
                let increment = 1;
                let css = `rotate(${angle}deg)`;
                tEl.style.transform = css;
                let stop = 1;
                if( true ) {
                    Animation.byDuration( ( timestamp: DOMHighResTimeStamp )=>{
                        angle += increment;
                        css = `rotate3d(1,1,1,${angle}deg)`;
                        tEl.style.transform = css;
                    }, 30000, 60 );
                }
                if( false ) {
                    Animation.byIterations( ( timestamp: DOMHighResTimeStamp )=>{
                        angle += increment;
                        css = `rotate(${angle}deg)`;
                        tEl.style.transform = css;
                    }, 150, 30 );
                }
            }
        }
    }
}
