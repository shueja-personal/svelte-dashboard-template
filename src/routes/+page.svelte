<script lang="ts">
    import TimerWidget from "$lib/components/widgets/Timer.widget.svelte"
    import ScoringGrid from "$lib/components/widgets/grid/ScoringGrid.svelte"
    import GridLayout from "$lib/components/widgets/GridLayout.svelte"
    import GridItem from "$lib/components/widgets/GridItem.svelte"
    import NT from "../util/NTStore"
    import Chooser from "$lib/components/widgets/Chooser.widget.svelte";
    import BooleanBox from "$lib/components/widgets/BooleanBox.widget.svelte";
	import { preventCloseIf } from "../util/windowutils";
	import { onDestroy } from "svelte";

    NT.setIP("10.69.95.2")
    let max = NT.IntegerSubscriber(150, "/DriverDisplay/maxTimer")
    let time = NT.DoubleSubscriber(-1, "/DriverDisplay/matchTime");
    let selection = NT.IntegerSubscriber(-1, "/DriverDisplay/selection")
    let enabled = NT.BooleanSubscriber(false, "/DriverDisplay/enabled");
    preventCloseIf(enabled);
    let autoOptions = NT.StringArraySubscriber([], "/SmartDashboard/SendableChooser[0]/options");
    let autoSelectedPub = NT.StringPublisher("/SmartDashboard/SendableChooser[0]selected")
	let autoActive = NT.StringSubscriber("", "/SmartDashboard/SendableChooser[0]/active")
    let ntConnected = NT.connected;
    


</script>
<main style="width:100vw; aspect-ratio: 16 / 9; overflow:hidden; box-sizing:border-box">
<GridLayout columns={9}>
<GridItem x={1} y={1} width={9} height={3}>
    <ScoringGrid selection={$selection} selectCallback={()=>{}} conesScored={[]} cubesScored={[]}></ScoringGrid>
</GridItem>
<GridItem x={6} y={4} width={4} height={2}>
    <TimerWidget value={$time} name={""} max={$max}></TimerWidget>
</GridItem>
<GridItem x={1} y={4} width={4} height={1}>
    <Chooser options={$autoOptions} active={$autoActive} selectedCB={autoSelectedPub} disabled={$enabled}></Chooser>
</GridItem>
<GridItem x={5} y={4} width={1} height={1}>
    <BooleanBox value={$ntConnected} label="Connection"></BooleanBox>
</GridItem>


</GridLayout>
</main>
