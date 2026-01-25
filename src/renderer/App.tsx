import { useEffect, useState } from "react"
import { createLogger } from "./utils/rendererLogger"

const logger = createLogger('Renderer:App')

function App() {

    useEffect(() => {
        logger.info('App component mounted')

        return () => {
            logger.info('App component unmounted')
        }
    })

    const clickHandleer = () => {
        logger.info('Button clicked')
    }
    const openLogsDirectoryClick = () => {
        logger.info(' Click Button for Opening logs directory', 'Renderer:App');
        window.electron.logger.openLogDir();
    };

    return (
        <>
            <div>My Electron-React App</div>
            <button onClick={clickHandleer}>Click Me</button>
            <button onClick={openLogsDirectoryClick}> Open Logs Directory</button>
        </>
    )
}

export default App