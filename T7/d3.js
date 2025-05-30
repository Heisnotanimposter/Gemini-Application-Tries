// Assuming you receive 'graphData' via WebSocket

function visualizeNetwork(graphData) {
    const svg = d3.select("#network-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    const nodes = graphData.nodes;
    const edges = graphData.edges;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges).id(d => d.id).distance(50))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(edges)
        .join("line");

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => Math.abs(d.sentiment) * 10 + 5) // Size based on sentiment intensity
        .attr("fill", d => d.sentiment > 0 ? "green" : d.sentiment < 0 ? "red" : "blue")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
        .text(d => `${d.id} (Sentiment: ${d.sentiment.toFixed(2)})`);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
}

// Assuming you have a WebSocket connection receiving 'graphData'
const socket = new WebSocket("ws://your-backend:port");
socket.onmessage = (event) => {
    const graphData = JSON.parse(event.data);
    visualizeNetwork(graphData);
};