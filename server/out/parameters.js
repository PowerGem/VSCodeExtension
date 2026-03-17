"use strict";
/**
 * TARA Parameter Metadata Database
 * Extracted from TARA 2601 Manual Appendix A.1
 * Used for validation and IntelliSense in .dir files
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TARA_PARAMETERS = void 0;
exports.getParametersByOptionBlock = getParametersByOptionBlock;
exports.findParameter = findParameter;
exports.getValidOptionBlocks = getValidOptionBlocks;
exports.TARA_PARAMETERS = [
    // opt cont - Contingency Options
    {
        name: 'monBranRatingBase',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 1,
        description: 'Base case rating (1-A; 2-B; 3-C)',
        validValues: ['1', '2', '3']
    },
    {
        name: 'monBranRatingCont',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 2,
        description: 'Contingency rating (1-A; 2-B; 3-C)',
        validValues: ['1', '2', '3']
    },
    {
        name: 'monBranRatingMultBase',
        optionBlock: 'opt cont',
        type: 'number',
        default: 100,
        description: 'Base case rating multipliers (%)'
    },
    {
        name: 'monBranRatingMultCont',
        optionBlock: 'opt cont',
        type: 'number',
        default: 100,
        description: 'Contingency rating multipliers (%)'
    },
    {
        name: 'monBranRatingEnAdd1',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 0,
        description: 'Enable additional rating reporting 1 (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'monBranRatingEnAdd2',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 0,
        description: 'Enable additional rating reporting 2 (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'contChanCutOffMW',
        optionBlock: 'opt cont',
        type: 'number',
        default: 5,
        description: 'MW cutoff to ignore constraints if cont.flow doesn\'t change'
    },
    {
        name: 'contChanCutOffPercent',
        optionBlock: 'opt cont',
        type: 'number',
        default: 2,
        description: 'Rating % cutoff for contingency flow change'
    },
    {
        name: 'PAR_AdjEnabledContAnal',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 1,
        description: 'Phase shifter model for base case (0-fixed angle; 1-control flow)',
        validValues: ['0', '1']
    },
    {
        name: 'adjustRatingMVA',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 0,
        description: 'Adjust branch MW rating based on MVAR flow (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'limitTypeLine',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 1,
        description: 'Use AMP (0) or MVA (1) limit for line violations',
        validValues: ['0', '1']
    },
    {
        name: 'limitTypeTran',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 0,
        description: 'Use AMP (0) or MVA (1) limit for transformer violations',
        validValues: ['0', '1']
    },
    {
        name: 'voltMinChange',
        optionBlock: 'opt cont',
        type: 'number',
        default: 0.001,
        description: 'Voltage change cutoff in PU to ignore violations'
    },
    {
        name: 'numContMaxAlloc',
        optionBlock: 'opt cont',
        type: 'number',
        default: 15000,
        description: 'Max number of contingencies'
    },
    {
        name: 'numEventsAlloc',
        optionBlock: 'opt cont',
        type: 'number',
        default: 35000,
        description: 'Max number of contingency events'
    },
    {
        name: 'numDispEventAlloc',
        optionBlock: 'opt cont',
        type: 'number',
        default: 60000,
        description: 'Max number of generation redispatch events'
    },
    {
        name: 'numLFgatesMaxAlloc',
        optionBlock: 'opt cont',
        type: 'number',
        default: 10000,
        description: 'Max number of flowgates'
    },
    {
        name: 'mulSecPrintMode',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 0,
        description: 'Multi-section line modelling (0-ignore; 1-honor)',
        validValues: ['0', '1']
    },
    {
        name: 'MAXOUTAGES',
        optionBlock: 'opt cont',
        type: 'number',
        default: 1000,
        description: 'Maximum number of outages'
    },
    {
        name: 'maxORAFlowResults',
        optionBlock: 'opt cont',
        type: 'number',
        default: 2000000,
        description: 'Maximum number of ORA or N-1-1 results to report'
    },
    {
        name: 'MonConMode',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 1,
        description: 'Monitoring mode (1-Regular; 2-Flowgate; 3-Voltgate; 4-Both)',
        validValues: ['1', '2', '3', '4']
    },
    {
        name: 'maxEvPerCont',
        optionBlock: 'opt cont',
        type: 'number',
        default: 60,
        description: 'Max monitored events per contingency'
    },
    {
        name: 'maxFgateBranches',
        optionBlock: 'opt cont',
        type: 'number',
        default: 100,
        description: 'Max number of monitored events per flowgate'
    },
    {
        name: 'maxFgEventTotal',
        optionBlock: 'opt cont',
        type: 'number',
        default: 30000,
        description: 'Total max number of monitored events among all flowgates'
    },
    {
        name: 'useContingencyComments',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 0,
        description: 'Use trailing contingency comments in contingency reporting (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'ignoreEnd2Exit',
        optionBlock: 'opt cont',
        type: 'enum',
        default: 0,
        description: 'Ignore END statement to exit reading sub/mon/con/exc files (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    // lfopt solve - Load Flow Solution Parameters
    {
        name: 'busMismToler',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 0.5,
        description: 'Bus Mismatch tolerance'
    },
    {
        name: 'MaxIterLF',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 50,
        description: 'Max N of iterations in DC LF'
    },
    {
        name: 'useFlatStart',
        optionBlock: 'lfopt solve',
        type: 'enum',
        default: 0,
        description: 'Use flat start during LF (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'ZeroImpThr',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 0.0001,
        description: 'Zero impedance threshold in PU'
    },
    {
        name: 'lowVoltCutOffLoad',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 0.8,
        description: 'Scale load down if voltage becomes low'
    },
    {
        name: 'maxVoltChangeInit',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 0.3,
        description: 'Max voltage magnitude change in PU per iteration - init stage'
    },
    {
        name: 'maxAngleChangeInit',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 3,
        description: 'Max voltage angle change in radians per iteration - init stage'
    },
    {
        name: 'maxVoltChangeFinal',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 0.2,
        description: 'Max voltage magnitude change in PU per iteration - final stage'
    },
    {
        name: 'maxAngleChangeFinal',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 1,
        description: 'Max voltage angle change in radians per iteration - final stage'
    },
    {
        name: 'numIterInit',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 3,
        description: 'Max iteration for initial stage'
    },
    {
        name: 'MemFactor',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 5,
        description: 'Sparse methods fill in allocation factor'
    },
    {
        name: 'voltTolnUser',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 0,
        description: 'Voltage magnitude tolerance for voltage control buses'
    },
    {
        name: 'lowVoltAddQGen',
        optionBlock: 'lfopt solve',
        type: 'enum',
        default: 0,
        description: 'Add Q at generator buses with low voltage (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'lowVoltCutOffQGen',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 0.7,
        description: 'Low voltage cutoff to add Qgen if voltage becomes low'
    },
    {
        name: 'highVoltReduceQGen',
        optionBlock: 'lfopt solve',
        type: 'enum',
        default: 0,
        description: 'Reduce Q at generator buses with high voltage (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'highVoltCutOffQGen',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 1.3,
        description: 'High Voltage cutoff to reduce Q gen for high voltage'
    },
    {
        name: 'lowVoltAddShunt',
        optionBlock: 'lfopt solve',
        type: 'enum',
        default: 0,
        description: 'Add Shunts at buses with low voltage (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'lowVoltCutOffShunt',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 0.7,
        description: 'Low voltage cutoff to add shunts if voltage becomes low'
    },
    {
        name: 'highVoltReduceShunt',
        optionBlock: 'lfopt solve',
        type: 'enum',
        default: 1,
        description: 'Remove fixed Shunt with high voltage (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'highVoltCutOffShunt',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 1.25,
        description: 'High Voltage cutoff to limit fixed shunts injection'
    },
    {
        name: 'ApplyBreakerImpOverride',
        optionBlock: 'lfopt solve',
        type: 'enum',
        default: 0,
        description: 'Apply breaker zero impedance override (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'BreakerZeroImp',
        optionBlock: 'lfopt solve',
        type: 'number',
        default: 0.000001,
        description: 'Low impedance value in PU for breakers and switches'
    },
    {
        name: 'fixedQGenRelax',
        optionBlock: 'lfopt solve',
        type: 'enum',
        default: 0,
        description: 'Relax Q at generators with Qmin=Qmax (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    // lfopt adj - Adjustment Parameters
    {
        name: 'iterCheckVarLimitHotStart',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 0,
        description: 'Iteration to start generator VAR limit checking - hot start'
    },
    {
        name: 'iterCheckVarLimitFlat',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 3,
        description: 'Iteration to start generator VAR limit checking - flat start'
    },
    {
        name: 'PAR_AdjEnabledLF',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 1,
        description: 'Enable Phase Shifter Adjustment (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'areaInterAdjustEnabled',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 0,
        description: 'Area interchange control (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'TAP_AdjEnabledLF',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 1,
        description: 'Enable TAP adjustment (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'shuntAdjEnabled',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 2,
        description: 'Enable shunt adjustment',
        validValues: ['0', '1', '2']
    },
    {
        name: 'DCLineAdjEnabled',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 0,
        description: 'Enable DC lines adjustment (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'showParAdj',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 1,
        description: 'Report PAR adjustments per iteration (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'showTapAdj',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 1,
        description: 'Report TAP adjustments per iteration (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'showShuntAdj',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 1,
        description: 'Report shunt adjustments per iteration (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'showAreaInterAdj',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 1,
        description: 'Area interchange reporting level',
        validValues: ['0', '1', '2']
    },
    {
        name: 'busMismTolerAreaInter',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 5,
        description: 'Bus Mismatch tolerance to start area adjustments'
    },
    {
        name: 'maxVarLimitsBusTypeChanges',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 6,
        description: 'Max times voltage controlled bus can change type'
    },
    {
        name: 'iterCheckVarLimitLast',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 40,
        description: 'Iteration to stop checking var limits'
    },
    {
        name: 'maxAdjustIterVolt',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 30,
        description: 'Iteration to stop TAP and Shunt adjustments'
    },
    {
        name: 'deacFactRTap',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 1,
        description: 'Voltage adjustment deacceleration factor'
    },
    {
        name: 'maxTapChange',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 0.02,
        description: 'Max tap ratio change per iteration'
    },
    {
        name: 'voltAdjTrigger',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 0.01,
        description: 'Max voltage magnitude change to activate TAP and Shunt adjustments'
    },
    {
        name: 'angleAdjTrigger',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 1,
        description: 'Max voltage angle change (in degrees) to activate PAR and area adjustments'
    },
    {
        name: 'showBusTypeChan',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 0,
        description: 'Show voltage controlled buses type changes (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'deOscilFactor',
        optionBlock: 'lfopt adj',
        type: 'number',
        default: 0.7,
        description: 'De-oscillation factor (if 1.0 - not activated)'
    },
    {
        name: 'areaInterAdjustEdit',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 1,
        description: 'Adjust area interchange when editing generation and load',
        validValues: ['0', '1', '2']
    },
    {
        name: 'fixedToSwitched',
        optionBlock: 'lfopt adj',
        type: 'enum',
        default: 0,
        description: 'Convert all fixed shunts to discrete switched shunts (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    // lfopt misc - Array Allocation Parameters
    {
        name: 'maxBuses',
        optionBlock: 'lfopt misc',
        type: 'number',
        default: 120000,
        description: 'Maximum number of buses'
    },
    {
        name: 'maxBranches',
        optionBlock: 'lfopt misc',
        type: 'number',
        default: 190000,
        description: 'Maximum number of branches (includes 2W and 3W transformers)'
    },
    {
        name: 'maxLoads',
        optionBlock: 'lfopt misc',
        type: 'number',
        default: 190000,
        description: 'Maximum number of loads'
    },
    {
        name: 'maxShunts',
        optionBlock: 'lfopt misc',
        type: 'number',
        default: 15000,
        description: 'Maximum number of shunts'
    },
    {
        name: 'maxTransfor',
        optionBlock: 'lfopt misc',
        type: 'number',
        default: 60000,
        description: 'Maximum number of 2W and 3W transformers total'
    },
    {
        name: 'maxGenerators',
        optionBlock: 'lfopt misc',
        type: 'number',
        default: 25000,
        description: 'Maximum number of generators and plants'
    },
    {
        name: 'branNamePrefix',
        optionBlock: 'lfopt misc',
        type: 'string',
        default: '/* [',
        description: 'Branch Names Prefix'
    },
    {
        name: 'branNameSuffix',
        optionBlock: 'lfopt misc',
        type: 'string',
        default: ']',
        description: 'Branch Names Suffix'
    },
    {
        name: 'readEquipNamesFromRAW',
        optionBlock: 'lfopt misc',
        type: 'enum',
        default: 0,
        description: 'Read equipment names from RAW file (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'reportBusAreaName',
        optionBlock: 'lfopt misc',
        type: 'enum',
        default: 0,
        description: 'Add area names to LF data reports (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'reportBusZoneName',
        optionBlock: 'lfopt misc',
        type: 'enum',
        default: 0,
        description: 'Add zone names to LF data reports (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'busOutputMode',
        optionBlock: 'lfopt misc',
        type: 'enum',
        default: 2,
        description: 'Default Bus output mode (1-names; 2-numbers)',
        validValues: ['1', '2']
    },
    {
        name: 'useCaseNameFullPath',
        optionBlock: 'lfopt misc',
        type: 'enum',
        default: 0,
        description: 'Use LF case name only (0) or full path as scenario name (1)',
        validValues: ['0', '1']
    },
    {
        name: 'busNameQuotes',
        optionBlock: 'lfopt misc',
        type: 'enum',
        default: 0,
        description: 'Add single quotes around bus names and CKT/ID in reports (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'NoStarBusNumbers',
        optionBlock: 'lfopt misc',
        type: 'enum',
        default: 0,
        description: 'Do not print bus numbers of 3-winding star buses in reports (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    // opt N-1-1
    {
        name: 'consPerMonBran',
        optionBlock: 'opt N-1-1',
        type: 'number',
        default: 5,
        description: 'Number of top contingencies to show per monitored branch'
    },
    {
        name: 'consPerMonBus',
        optionBlock: 'opt N-1-1',
        type: 'number',
        default: 5,
        description: 'Number of top contingencies to show per monitored bus'
    },
    // opt EMS
    {
        name: 'emsNamingMethod',
        optionBlock: 'opt EMS',
        type: 'enum',
        default: 1,
        description: 'Method for naming EMS equipment (1-PJM; 2-MISO; 3-ISO-NE)',
        validValues: ['1', '2', '3']
    },
    {
        name: 'useAUXMonStatus',
        optionBlock: 'opt EMS',
        type: 'enum',
        default: 0,
        description: 'Use monitored branch status field in AUX file (0-No; 1-Yes)',
        validValues: ['0', '1']
    },
    {
        name: 'reduceCaseMode',
        optionBlock: 'opt EMS',
        type: 'enum',
        default: 0,
        description: 'Case reduction (0-no; 1-basic; 2-remove radial)',
        validValues: ['0', '1', '2']
    },
    {
        name: 'reduceAtRuntime',
        optionBlock: 'opt EMS',
        type: 'enum',
        default: 0,
        description: 'Keep node-breaker model but reduce topology at run-time (0-No; 1-Yes)',
        validValues: ['0', '1']
    },
    {
        name: 'neOverrideFormat',
        optionBlock: 'opt EMS',
        type: 'enum',
        default: 0,
        description: 'Format of NE override data (0-AUX; 1-CSV)',
        validValues: ['0', '1']
    },
    // opt screen
    {
        name: 'limitFgateMode0',
        optionBlock: 'opt screen',
        type: 'enum',
        default: 0,
        description: 'Limit flowgate name to 40 characters (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'limitFgateName40',
        optionBlock: 'opt screen',
        type: 'enum',
        default: 0,
        description: 'Limit flowgate name created by screening to 40 characters (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    // opt sced options
    {
        name: 'maxBidPoints',
        optionBlock: 'opt sced options',
        type: 'number',
        default: 10000,
        description: 'Maximum number of Pnodes'
    },
    {
        name: 'MAXBIDBLOCKS',
        optionBlock: 'opt sced options',
        type: 'number',
        default: 100000,
        description: 'Maximum number of bids/cost curves'
    },
    {
        name: 'maxZonFactors',
        optionBlock: 'opt sced options',
        type: 'number',
        default: 40000,
        description: 'Maximum number of zonal factors'
    },
    {
        name: 'CPNODEMAX',
        optionBlock: 'opt sced options',
        type: 'number',
        default: 10,
        description: 'Maximum number of cp nodes for MISO ASM'
    },
    {
        name: 'CPNODEPERBUS',
        optionBlock: 'opt sced options',
        type: 'number',
        default: 10,
        description: 'Maximum number of cp nodes per bus for MISO ASM'
    },
    // opt amb - AMB Multi-Snapshot Analysis
    {
        name: 'useFirmTransOnly',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 1,
        description: 'Transaction schedule (0-All; 1-Firm Only)',
        validValues: ['0', '1']
    },
    {
        name: 'AMBStartDateMethod',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 1,
        description: 'Calculation Start Time (0-computer; 1-subsystem; 2-user defined)',
        validValues: ['0', '1', '2']
    },
    {
        name: 'AMB_CommandFile',
        optionBlock: 'opt amb',
        type: 'string',
        description: 'AMB command file to execute per each snapshot'
    },
    {
        name: 'optBuildSnapNEScreen',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 0,
        description: 'Build models only for topology changes (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'MAXHOURS_AMB',
        optionBlock: 'opt amb',
        type: 'number',
        default: 400,
        description: 'Maximum Hourly snapshots (48-8760)',
        minValue: 48,
        maxValue: 8760
    },
    {
        name: 'MAXDAYS_AMB',
        optionBlock: 'opt amb',
        type: 'number',
        default: 180,
        description: 'Maximum Daily snapshots (35-1096)',
        minValue: 35,
        maxValue: 1096
    },
    {
        name: 'MAXWEEKS_AMB',
        optionBlock: 'opt amb',
        type: 'number',
        default: 52,
        description: 'Maximum Weekly snapshots (5-104)',
        minValue: 5,
        maxValue: 104
    },
    {
        name: 'MAXMONTHS_AMB',
        optionBlock: 'opt amb',
        type: 'number',
        default: 60,
        description: 'Maximum Monthly snapshots (18-120)',
        minValue: 18,
        maxValue: 120
    },
    {
        name: 'SDXGensMax',
        optionBlock: 'opt amb',
        type: 'number',
        default: 200000,
        description: 'Maximum number of SDX generator event'
    },
    {
        name: 'SDXBranMax',
        optionBlock: 'opt amb',
        type: 'number',
        default: 10000,
        description: 'Maximum number of SDX branch event'
    },
    {
        name: 'SDX_3WTranMax',
        optionBlock: 'opt amb',
        type: 'number',
        default: 10000,
        description: 'Maximum number of SDX 3Winding outages'
    },
    {
        name: 'useGrossLoadForecast',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 1,
        description: 'SDX files use gross load forecast with losses (0-No; 1-Yes)',
        validValues: ['0', '1']
    },
    {
        name: 'adjustAreaWithNoLoad',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 1,
        description: 'Redispatch areas with no load forecast (0-No; 1-Yes)',
        validValues: ['0', '1']
    },
    {
        name: 'GMTShiftEngine',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 5,
        description: 'Calculation target time zone (5-EST&EDT; 6-CST&CDT)',
        validValues: ['5', '6']
    },
    {
        name: 'stopAMBOnLoadError',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 0,
        description: 'Exit AMB process on Load forecast error (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'TDFSaveFormat',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 0,
        description: 'TDF Save mode (0-CSV; 1-Binary)',
        validValues: ['0', '1']
    },
    {
        name: 'TDFSaveModeHourly',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 1,
        description: 'Method to save TDF (1-every; 2-on changes; 3-force at end)',
        validValues: ['1', '2', '3']
    },
    {
        name: 'TDFSaveCutOffHoulry',
        optionBlock: 'opt amb',
        type: 'number',
        default: 0.01,
        description: 'TDF factors change cutoff to create new hourly TDF set'
    },
    {
        name: 'SchedLookAhead',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 1,
        description: 'Dynamic scheduling horizon or fixed window hours',
        validValues: ['1', '2']
    },
    {
        name: 'AMB_LookAhead',
        optionBlock: 'opt amb',
        type: 'number',
        default: 1,
        description: 'Hours from AMB reference time to start creating LF models'
    },
    {
        name: 'useSlidingWindow',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 1,
        description: 'Use Dynamic Scheduling Horizon until midnight (0-No; 1-Yes)',
        validValues: ['0', '1']
    },
    {
        name: 'SlidingWindowHours',
        optionBlock: 'opt amb',
        type: 'number',
        default: 10,
        description: 'Starting hour to extend scheduling horizon by 24 hours'
    },
    {
        name: 'AMBPeriodType',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 2,
        description: 'AMB Period type (1-FULL; 2-ON_PEAK; 3-OFF_PEAK)',
        validValues: ['1', '2', '3']
    },
    {
        name: 'OffPeakLoadScaleFact',
        optionBlock: 'opt amb',
        type: 'number',
        default: 0.85,
        description: 'Off-Peak Load Scaling Factor (0-1)',
        minValue: 0,
        maxValue: 1
    },
    {
        name: 'FirstHourPeak',
        optionBlock: 'opt amb',
        type: 'number',
        default: 11,
        description: 'First Hour (0-23) for Representative Peak Time Window',
        minValue: 0,
        maxValue: 23
    },
    {
        name: 'LastHourPeak',
        optionBlock: 'opt amb',
        type: 'number',
        default: 21,
        description: 'Last Hour (0-23) for Representative Peak Time Window',
        minValue: 0,
        maxValue: 23
    },
    {
        name: 'FirstHourOffPeak',
        optionBlock: 'opt amb',
        type: 'number',
        default: 3,
        description: 'First Hour (0-23) for Representative Off-Peak Time Window',
        minValue: 0,
        maxValue: 23
    },
    {
        name: 'LastHourOffPeak',
        optionBlock: 'opt amb',
        type: 'number',
        default: 5,
        description: 'Last Hour (0-23) for Representative Off-Peak Time Window',
        minValue: 0,
        maxValue: 23
    },
    {
        name: 'AMB_RepresentWeekDay',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 3,
        description: 'Representative Week Day (1-Mon; 2-Tue; 3-Wed; ...)',
        validValues: ['1', '2', '3', '4', '5', '6', '7']
    },
    {
        name: 'AMB_RepresentWeekNumber',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 3,
        description: 'Representative Week for Monthly AFC (1-5)',
        validValues: ['1', '2', '3', '4', '5']
    },
    {
        name: 'adjustDailyLoadForProfile',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 0,
        description: 'Adjust Daily load for load profile if defined (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'EMSFlowsEnable',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 0,
        description: 'Enable using EMS flows for hourly AFC (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'EMSFlowsHoursFullImpact',
        optionBlock: 'opt amb',
        type: 'number',
        default: 4,
        description: 'Hours from hour 1 to fully utilize EMS flow bias'
    },
    {
        name: 'EMSFlowsLastHour',
        optionBlock: 'opt amb',
        type: 'number',
        default: 8,
        description: 'Last hours to use EMS flows bias'
    },
    {
        name: 'EMSFlowsType',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 3,
        description: 'EMSFlowsType (1-SCADA; 2-State Estimator; 3-both)',
        validValues: ['1', '2', '3']
    },
    {
        name: 'EMSFlowsUsePartial',
        optionBlock: 'opt amb',
        type: 'enum',
        default: 0,
        description: 'Use EMS flows bias if flows available only for some elements (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    // opt trlim
    {
        name: 'TrLimMode',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 0,
        description: 'Single or multiple TrLim mode (0-single; 1-parallel)',
        validValues: ['0', '1']
    },
    {
        name: 'sendSysNameTrLim',
        optionBlock: 'opt trlim',
        type: 'string',
        description: 'Sending subsystem name for transfer limit analysis'
    },
    {
        name: 'recSysNameTrLim',
        optionBlock: 'opt trlim',
        type: 'string',
        description: 'Receiving subsystem name for transfer limit analysis'
    },
    {
        name: 'SensCutOffMode',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 0,
        description: 'Traditional single cutoff (0) or separate base/cont cutoffs (1)',
        validValues: ['0', '1']
    },
    {
        name: 'SensCutOff',
        optionBlock: 'opt trlim',
        type: 'number',
        default: 0.01,
        description: 'Redispatch distribution factors cutoff'
    },
    {
        name: 'maxTransferTestMW',
        optionBlock: 'opt trlim',
        type: 'number',
        default: 1000,
        description: 'Maximum redispatch test level'
    },
    {
        name: 'maxViolPerCons',
        optionBlock: 'opt trlim',
        type: 'number',
        default: 5,
        description: 'Maximum times to report the same monitored element'
    },
    {
        name: 'reportInitViol',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 0,
        description: 'Report initial overload in FCITC report (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'ignoreNegDfaxInitViol',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 1,
        description: 'Ignore initial violation if transfer reduces overload (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'reportFlowgate',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 0,
        description: 'Report flowgate in single TrLim mode (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'interfShowPostAC',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 0,
        description: 'Show post-contingency AC interface MW flow when AC-verified (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'enfSysLimits',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 0,
        description: 'Transfer cannot exceed min of send/receive available MW (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'reportPathName',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 0,
        description: 'Report sending/receiving system names for each line',
        validValues: ['0', '1', '2']
    },
    {
        name: 'FacilityNameParse',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 1,
        description: 'Enable facility name parsing in TrLim reports',
        validValues: ['0', '1']
    },
    {
        name: 'FacilityLength',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 1,
        description: 'Include transmission line length in TrLim reports',
        validValues: ['0', '1']
    },
    {
        name: 'Area',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 1,
        description: 'Include area number in TrLim reports',
        validValues: ['0', '1']
    },
    {
        name: 'AreaName',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 1,
        description: 'Include area name in TrLim reports',
        validValues: ['0', '1']
    },
    {
        name: 'Zone',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 1,
        description: 'Include zone number in TrLim reports',
        validValues: ['0', '1']
    },
    {
        name: 'ZoneName',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 1,
        description: 'Include zone name in TrLim reports',
        validValues: ['0', '1']
    },
    {
        name: 'ExtBusName',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 0,
        description: 'Use extended bus name in TrLim reports (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    {
        name: 'DetailContEvent',
        optionBlock: 'opt trlim',
        type: 'enum',
        default: 0,
        description: 'Include contingency event details in TrLim reports (0-no; 1-yes)',
        validValues: ['0', '1']
    },
    // opt misc
    {
        name: 'needReportHeader',
        optionBlock: 'opt misc',
        type: 'enum',
        default: 0,
        description: 'Report header (0-no; 1-yes)',
        validValues: ['0', '1']
    }
];
function getParametersByOptionBlock(blockName) {
    const normalizedBlock = blockName.toLowerCase();
    return exports.TARA_PARAMETERS.filter(parameter => parameter.optionBlock.toLowerCase() === normalizedBlock);
}
function findParameter(name, optionBlock) {
    const normalizedName = name.toLowerCase();
    if (optionBlock) {
        const normalizedBlock = optionBlock.toLowerCase();
        const blockMatch = exports.TARA_PARAMETERS.find(parameter => parameter.name.toLowerCase() === normalizedName &&
            parameter.optionBlock.toLowerCase() === normalizedBlock);
        if (blockMatch) {
            return blockMatch;
        }
    }
    return exports.TARA_PARAMETERS.find(parameter => parameter.name.toLowerCase() === normalizedName);
}
function getValidOptionBlocks() {
    const blocks = new Set(exports.TARA_PARAMETERS.map(p => p.optionBlock));
    return Array.from(blocks).sort();
}
//# sourceMappingURL=parameters.js.map