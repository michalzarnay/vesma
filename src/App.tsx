import { WizardContainer } from './components/wizard/WizardContainer';
import { PrihlasenieBrana } from './components/auth/PrihlasenieBrana';

function App() {
  return (
    <PrihlasenieBrana>
      <WizardContainer />
    </PrihlasenieBrana>
  );
}

export default App;
