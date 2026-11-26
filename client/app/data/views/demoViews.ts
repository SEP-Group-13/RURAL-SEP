import type { ViewHandler } from './ViewHandler'

export function addDemoViews(viewHandler: ViewHandler): void {
  const defaultView = viewHandler.getActiveView()

  viewHandler.createView()
  const women = viewHandler.getActiveView()
  viewHandler.renameView(women.getId(), 'Women 40+')
  women.setFilter({ columnKey: 'sex', operator: 'in', value: ['Female'] })
  women.setFilter({ columnKey: 'age', operator: 'between', value: { min: 40, max: null } })
  women.setSort('age', 'asc')

  viewHandler.createView()
  const boneScan = viewHandler.getActiveView()
  viewHandler.renameView(boneScan.getId(), 'Bone scan study')
  boneScan.hideColumn('timeBurden')
  boneScan.hideColumn('timeBand')
  boneScan.addSimulationColumn('Bone scan (mSv)', 5)
  boneScan.addFormulaColumn('Radiation after scan (mSv)', '[radiationBurden] + [simulation1]', 'radiation')
  boneScan.setSort('formula1', 'desc')

  viewHandler.createView()
  const contact = viewHandler.getActiveView()
  viewHandler.renameView(contact.getId(), 'Contact burden 2025')
  contact.setSelectedYears([2025])
  contact.hideColumn('timeBurden')
  contact.hideColumn('timeBand')
  contact.hideColumn('radiationBurden')
  contact.hideColumn('radiationBand')
  contact.addPredefinedFormula('contactFrequencyBurden')
  contact.showColumn('email')
  contact.setSort('contactFrequencyBurden', 'desc')

  viewHandler.setActiveView(defaultView.getId())
}
