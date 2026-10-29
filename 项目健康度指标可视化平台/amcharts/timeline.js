function showprochart(mydata){
	am4core.useTheme(am4themes_animated);
	am4core.useTheme(am4themes_dark);
	// Themes end

	var chart = am4core.create("chartdiv1", am4plugins_timeline.CurveChart);
	chart.curveContainer.padding(0, 80, 0, 100);
	chart.maskBullets = false;

	var colorSet = new am4core.ColorSet();

	chart.data = mydata;
	console.log(mydata);
	// chart.dateFormatter.inputDateFormat = "yyyy-mm-dd";

	chart.fontSize = 12;
	chart.tooltipContainer.fontSize = 13;

	var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
	categoryAxis.dataFields.category = "ctype";
	categoryAxis.renderer.grid.template.disabled = true;

	var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
	dateAxis.renderer.points = [{ x: -400, y: 0 }, { x: 0, y: 50 }, { x: 400, y: 0 }]
	dateAxis.renderer.polyspline.tensionX = 0.8;
	dateAxis.renderer.grid.template.disabled = true;
	dateAxis.renderer.line.strokeDasharray = "3,2";
	dateAxis.baseInterval = {period:"day", count:1}; // otherwise initial animation will be not smooth

	dateAxis.renderer.labels.template.disabled = true;

	var series = chart.series.push(new am4plugins_timeline.CurveLineSeries());
	series.strokeOpacity = 0;
	series.dataFields.dateX = "cid";
	series.dataFields.categoryY = "category";
	series.dataFields.value = "8";//"cirsize";
	series.baseAxis = categoryAxis;

	var interfaceColors = new am4core.InterfaceColorSet();

	series.tooltip.pointerOrientation = "down";

	var distance = 100;
	var angle = 60;

	var bullet = series.bullets.push(new am4charts.Bullet());

	var line = bullet.createChild(am4core.Line);
	line.adapter.add("stroke", function(fill, target) {
	  if (target.dataItem) {
	    return chart.colors.getIndex(target.dataItem.index)
	  }
	});

	line.x1 = 0;
	line.y1 = 0;
	line.y2 = 0;
	line.x2 = distance - 10;
	line.strokeDasharray = "3,3";
	// line.strokeThickness = 2;

	var circle = bullet.createChild(am4core.Circle);
	circle.radius = 30;
	circle.fillOpacity = 1;
	circle.strokeOpacity = 0;

	var circleHoverState = circle.states.create("hover");
	circleHoverState.properties.scale = 1.3;

	series.heatRules.push({ target: circle, min: 20, max: 50, property: "radius" });
	var atindex = 99;
	//设置颜色
	circle.adapter.add("fill", function(fill, target) {
	  if (target.dataItem) {
	    if(target.dataItem.dataContext.cstates=="0"){
	    	return am4core.color("#adabab");
	    }else{
	    	return chart.colors.getIndex(target.dataItem.index);
	    }
	  }
	});
	circle.tooltipText = "cclassname: {value}";
	circle.adapter.add("tooltipY", function(tooltipY, target){
	  return -target.pixelRadius - 4;
	});

	// 圈内显示
	var datesLabel = bullet.createChild(am4core.Label);
	datesLabel.text = "{ctype}\n{cname}";
	datesLabel.strokeOpacity = 0;
	datesLabel.fill = am4core.color("#fff");
	datesLabel.horizontalCenter = "middle";
	datesLabel.verticalCenter = "middle";
	datesLabel.interactionsEnabled = false;

	// 分支显示
	var label = bullet.createChild(am4core.Label);
	label.propertyFields.text = "dotime";
	label.strokeOpacity = 0;
	label.fill = am4core.color("#000")
	label.horizontalCenter = "right";
	label.verticalCenter = "middle";

	label.adapter.add("opacity", function(opacity, target) {
	  if(target.dataItem){
	    var index = target.dataItem.index;
	    var line = target.parent.children.getIndex(0);

	    if (index % 2 == 0) {
	      target.y = -distance * am4core.math.sin(-angle);
	      target.x = -distance * am4core.math.cos(-angle);
	      line.rotation = -angle - 180;
	      target.rotation = -angle;
	    }
	    else {
	      target.y = -distance * am4core.math.sin(angle);
	      target.x = -distance * am4core.math.cos(angle);
	      line.rotation = angle - 180;
	      target.rotation = angle;
	    }
	  }
	  return 1;
	});

	var outerCircle = bullet.createChild(am4core.Circle);
	outerCircle.radius = 30;
	outerCircle.fillOpacity = 0;
	outerCircle.strokeOpacity = 0;
	outerCircle.strokeDasharray = "2,2";

	var hoverState = outerCircle.states.create("hover");
	hoverState.properties.strokeOpacity = 0.8;
	hoverState.properties.scale = 1.5;
	//鼠标样式
	outerCircle.cursorOverStyle = am4core.MouseCursorStyle.pointer;

	outerCircle.events.on("over", function(event){
	  var circle = event.target.parent.children.getIndex(1);
	  circle.isHover = true;
	  event.target.stroke = circle.fill;
	  event.target.radius = circle.pixelRadius;
	  event.target.animate({property: "rotation", from: 0, to: 360}, 4000, am4core.ease.sinInOut);
	  let cdata = event.target.dataItem.dataContext;
	  statestr='';
	  let tiptxt = "操作：" + cdata.ctype;
	  switch (cdata.ctype){
	  	case "创建":
	  		tiptxt += "\n创建人：" + cdata.operatorname;
	  		tiptxt += "\n创建时间：" + parent.timestampToDate(cdata.coperatortime);
	  		break;
	  	case "转移":
	  		tiptxt += "\n操作人员：" + cdata.operatorname;
	  		tiptxt += "\n转移时间：" + parent.timestampToDate(cdata.coperatortime);
	  		tiptxt += "\n接收：" + cdata.cname;
	  		tiptxt += "\n起始时间：" + parent.timestampToDate(cdata.cstime);
	  		tiptxt += "\n释放时间：" + parent.timestampToDate(cdata.cetime);
	  		break;
	  	case "认领":
	  		tiptxt += "\n认领人：" + cdata.cname;
	  		tiptxt += "\n起始时间：" + parent.timestampToDate(cdata.cstime);
	  		tiptxt += "\n释放时间：" + parent.timestampToDate(cdata.cetime);
	  		break;
	  	case "入池":
	  		if(cdata.operatorname=''){
	  			tiptxt += "\n操作人员：系统自动";
	  		}else{
	  			tiptxt += "\n操作人员：" + cdata.cname;
	  		}
	  		tiptxt += "\n进入时间：" + parent.timestampToDate(cdata.cstime);
	  		tiptxt += "\n出池时间：" + parent.timestampToDate(cdata.cetime);
	  		break;
	  }
	  circle.tooltipText = tiptxt;
	});

	
	categoryAxis.renderer.labels.template.cursorOverStyle = am4core.MouseCursorStyle.pointer;
	chart.scrollbarX = new am4core.Scrollbar();
	chart.scrollbarX.opacity = 0.2;
	chart.scrollbarX.width = am4core.percent(50);
	chart.scrollbarX.align = "center";
	// 
}
//鼠标移入称出
$('.right_click').hover(
    function() {
      $(this).stop().fadeIn(); // 鼠标移入
    },
    function() {
      $(this).stop().fadeOut(); // 鼠标移出
    }
);
