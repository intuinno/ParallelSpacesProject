$('#page1').live('pageinit', function() {

	var PSmin = 4, PSmax = 5;

	$("#range-1a").on("change", function(event) {

		PSmin = event.target.value;
	});

	$("#range-1b").on("change", function(event) {

		PSmax = event.target.value;
	});

	var w = 450;
	var h = 450;
	var margin = 20;

	var ratings;
	var userData;
	var movieData;
	var userGalaxy = [];
	var movieGalaxy = [];
	var selectedUsers = [];
	var selectedMovies = [];
	var movieLength;
	var userLength;
	var movieStar, userStar;
	var selectedClassList =[];

	var isMovieSelected = false;
	var movieStarColor = d3.rgb("darkgray");
	var userStarColor = d3.rgb("darkgray");

	var movieStarHue = 45;
	var userStarHue = 45;

	var movieTitle = [];
	var movieTitleOrig = [];

	var ordinalColor = d3.scale.category10();

	var movieVQnum = 0;

	

	var x = d3.scale.linear().domain([0, 1]).range([margin, w - margin]);

	var y = d3.scale.linear().domain([0, 1]).range([ h - margin, margin]);
	
	
	var xAxis	= d3.svg.axis()
					.scale(x)
					.orient("bottom")
					.ticks(5);
					
	var yAxis	= d3.svg.axis()
					.scale(y)
					.orient("left")
					.ticks(5);	
					
	var zoomMovie = d3.behavior.zoom()
					.x(x)
					.y(y)
					.on("zoom",zoomedMovie);
					
	
	var svgMovie = d3.select("#movieCanvas")
					.append("svg")
						.attr("height", "450px")
						.attr("viewBox", "0 0 " + w + " " +h)
						.attr("title", "Movie Space")
						.style("border", "1px solid silver")
					.append("svg:g");
	//					.attr("transform", "translate(" + margin + "," + margin + ")");	
						
	var clip = svgMovie.append("defs")
						.append("svg:clipPath")
						.attr("id","movieClip")
						.append("svg:rect")
						.attr("id","clip-rect")
						.attr("x","0")
						.attr("y","0")
						.attr("width",w-2*margin)
						.attr("height",h-2*margin);
						
	var svgMovieBody = svgMovie.append("g")
							.attr("clip-path","url(#movieClip)")
							.attr("transform", "translate(" + margin + "," + margin + ")")
							.call(zoomMovie);
							
	var rect = svgMovieBody.append("svg:rect")
							.attr("width",w-2*margin)
							.attr("height",h-2*margin)
							.attr("fill","white");
						
						
						

	var svgMovieSelectionGroup = svgMovieBody.append("svg:g").attr('class', 'movieSelectionSVGGroup');

	var svgMovieGroup = svgMovieBody.append("svg:g").attr('class', 'movieSVGGroup');
	// var brush = d3.svg.brush() 
					// .x(x)
					// .y(y)
					// .on("brushstart",brushstart)
					// .on("brush",brushmove)
					// .on("brushend",brushend);
					
	svgMovie.append("svg:g")
			.attr("class","x axis")
			.attr("transform","translate(0," + (h-margin) + ")")
			.call(xAxis);
			
	svgMovie.append("svg:g")
			.attr("class","y axis")
			.attr("transform","translate(" + margin + ",0)")
			.call(yAxis);

	d3.csv("data/ratings.csv", function(ratingsCSV) {

		ratings = ratingsCSV;
		userLength = ratings.length;
		movieLength = d3.keys(ratings[0]).length;

	})

	d3.csv("data/movieSpace_year.csv", function(movieCSV) {

		movieData = movieCSV;

		for (var count = 0; count < movieData.length; count++) {

			movieTitle[count] = movieData[count].title;
			movieTitleOrig[count] = movieData[count].title;
		}

		movieStar = svgMovieGroup.selectAll("circle")
						.data(movieCSV,function(d) {return d.index;})
						.enter()
					.append("svg:circle")
					.classed("movieCircle", true)
					.classed("star", true)
					.attr("cx", function(d) {
						return x(+d.X);
					})
					.attr("cy", function(d) {
						return y(+d.Y);
					})
					.attr("r", function(d) {
						return (+d.numReview * 10);
					})
					.attr("fill", function(d) {
						return d3.hsl(movieStarHue, d.avgReview, d.avgReview);
					})
					.attr("opacity", function(d) {
						return d.avgReview;
					})
					.on('click', function(d, i) {

						var tempGalaxy = [];

						if(isMovieSelected === false) {
						
							
							isMovieSelected = true;
							clearMovieSelection();
						
						}
						if (selectedMovies.indexOf(d) === -1) {
			
							selectedMovies.push(d);
							
							var newIndex = 1;
							
														
							while ( selectedClassList.indexOf(newIndex) != -1) {
								newIndex += 1;
								
							}
							
							selectedClassList.push(newIndex);
						
							tempClass = "selected" + newIndex;
			
							for (var count = 0; count < userLength; count++) {
			
								if (ratings[count][i] >= PSmin && ratings[count][i] <= PSmax) {
			
									tempGalaxy.push(userData[count]);
								}
							}
			
							svgUserSelectionGroup.selectAll("." + tempClass)
										.data(tempGalaxy, function(d) {
											return +d.num;
										})
										.enter()
										.append("circle")
										.attr("cx", function(d) {
											return x(+d.X);
										})
										.attr("cy", function(d) {
											return y(+d.Y);
										})
										.attr("r", function(d) {
											return (+d.numReview * 10 +2);
										})
										.classed(tempClass, true)
										.classed("selectedCircle",true);
			
							this.classList.add(tempClass);
			
						} else {
							
							
							var tempIndex = selectedMovies.indexOf(d);
							
							tempClass = "selected" + (selectedClassList[tempIndex]);
							
							selectedMovies.splice(tempIndex, 1);
							
							selectedClassList.splice(tempIndex,1);
							
							this.classList.remove(tempClass);
							
							svgUserSelectionGroup.selectAll("." + tempClass)
										.remove();
										
						}


					});

		$('.movieCircle').tipsy({
			gravity : 'w',
			html : true,
			fade : true,
			delayOut : 1000,
			title : function() {
				var d = this.__data__, c = d.title;
				return '<a href="' + d.url + '" target="_blank ">' + c + '</a>';
			}
		});

	});

	var xScaleUser = d3.scale.linear().domain([0, 1]).range([margin, w-margin]);
	var yScaleUser = d3.scale.linear().domain([0,1]).range([margin,w-margin]);
	
	var xAxisUser = d3.svg.axis()
						.scale(xScaleUser)
						.orient("bottom")
						.ticks(5);
						
	var yAxisUser = d3.svg.axis()
						.scale(yScaleUser)
						.orient("left")
						.ticks(5);
						
	var zoomUser = d3.behavior.zoom()
						// .x(xScaleUser)
						// .y(yScaleUser)
						.on("zoom", zoomedUser);
						
	var svgUser = d3.select("#userCanvas")
					.append("svg")
						.attr("height", "450px")
						.attr("viewBox", "0 0 " + w + " " +h)
						.attr("title", "User Space")
						.style("border", "1px solid silver")
					.append("svg:g");
					
	var clip = svgUser.append("defs")
						.append("svg:clipPath")
						.attr("id","userClip")
						.append("svg:rect")
						.attr("id","clip-rect")
						.attr("x","0")
						.attr("y","0")
						.attr("width",w-2*margin)
						.attr("height",h-2*margin);
						
	var svgUserBody = svgUser.append("g")
							.attr("clip-path","url(#userClip)")
							.attr("transform", "translate(" + margin + "," + margin + ")")
							.call(zoomUser);
							
	var rect = svgUserBody.append("svg:rect")
							.attr("width",w-2*margin)
							.attr("height",h-2*margin)
							.attr("fill","white");
							
	
	var svgUserSelectionGroup = svgUserBody.append("svg:g").attr('class', 'userSelectionSVGGroup');

	var svgUserGroup = svgUserBody.append("svg:g").attr('class', 'userSVGGroup');


	svgUser.append("svg:g")
			.attr("class","x axis")
			.attr("transform","translate(0," + (h-margin) + ")")
			.call(xAxisUser);
			
	svgUser.append("svg:g")
			.attr("class","y axis")
			.attr("transform","translate(" + margin + ",0)")
			.call(yAxisUser);
	
	d3.csv("data/userSpace.csv", function(userCSV) {

		userData = userCSV;

		svgUserGroup.selectAll("circle")
					.data(userCSV, function(d) {
						return +d.num;
					})
					.enter()
					.append("circle")
					.classed("userCircle", true)
					.classed("star", true)
					.attr("cx", function(d) {
						return x(+d.X);
					})
					.attr("cy", function(d) {
						return y(+d.Y);
					})
					.attr("r", function(d) {
			//  console.log((d.numReview*5)*(d.numReview*10));
						return (d.numReview * 10);

					})
					.attr("fill", function(d) {
							
						return d3.hsl(userStarHue, d.avgReview, d.avgReview);
					})
					.attr("opacity", function(d) {
						return d.avgReview;
					})
					.on('click', function(d, i) {

						var tempGalaxy = [];

						if(isMovieSelected === true) {
						
							
							isMovieSelected = false;
							clearUserSelection();
						
						}
						if (selectedUsers.indexOf(d) === -1) {
			
							selectedUsers.push(d);
							
							var newIndex = 1;
							
														
							while ( selectedClassList.indexOf(newIndex) != -1) {
								newIndex += 1;
								
							}
							
							selectedClassList.push(newIndex);
						
							tempClass = "selected" + newIndex;
			
							for (var count = 0; count < movieLength; count++) {
			
								if (ratings[i][count] >= PSmin && ratings[i][count] <= PSmax) {
			
									tempGalaxy.push(movieData[count]);
								}
							}
			
							svgMovieSelectionGroup.selectAll("."+tempClass)
										.data(tempGalaxy, function(d) {
											return +d.index;
										})
										.enter()
										.append("circle")
										.attr("cx", function(d) {
											return x(+d.X);
										})
										.attr("cy", function(d) {
											return y(+d.Y);
										})
										.attr("r", function(d) {
											return (+d.numReview * 10 +2);
										})
										.classed(tempClass, true)
										.classed("selectedCircle",true);
			
							this.classList.add(tempClass);
			
						} else {
							
							
							var tempIndex = selectedUsers.indexOf(d);
							
							tempClass = "selected" + (selectedClassList[tempIndex]);
							
							selectedUsers.splice(tempIndex, 1);
							
							selectedClassList.splice(tempIndex,1);
							
							this.classList.remove(tempClass);
							
							svgMovieSelectionGroup.selectAll("." + tempClass)
										.remove();
										
						}


					});
					
														
					
			

		$('.userCircle').tipsy({
			gravity : 'w',
			html : true,
			fade : true,
			delayOut : 1000,
			title : function() {
				var d = this.__data__;
				return d.age + ', ' + d.sex + ', ' + d.job;
			}
		});

	})
	function zoomedMovie() {
// 
		svgMovieSelectionGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		svgMovieGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		svgMovie.select(".x.axis").call(xAxis);
		svgMovie.select(".y.axis").call(yAxis);
	}
	
	function zoomedUser() {
// 
		svgUserSelectionGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		svgUserGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		svgUser.select(".x.axis").call(xAxisUser);
		svgUser.select(".y.axis").call(yAxisUser);
	}

	function clearMovieSelection() {

		movieGalaxy = [];
		selectedUsers = [];
	

		svgMovieSelectionGroup.selectAll(".selectedCircle").remove();
		
		for (var i=0; i<selectedClassList.length; i++) {
		    
		    var tempClass = "selected" + selectedClassList[i];
		    
		    svgUserGroup.selectAll("."+tempClass)
		    			.classed(tempClass, false);
		 }
		 
		selectedClassList = [];
	}

	function clearUserSelection() {

		userGalaxy = [];
		selectedMovies = [];
		
		svgUserSelectionGroup.selectAll(".selectedCircle").remove();

		for (var i=0; i<selectedClassList.length; i++) {
		    
		    var tempClass = "selected" + selectedClassList[i];
		    
		    
		    svgMovieGroup.selectAll("."+tempClass)
		    			.classed(tempClass, false);
		 }
		    			    
		
        selectedClassList = [];
	}

	
	$(function() {

		$("#searchMovie").autocomplete({
			source : movieTitle,
			target : $('#suggestions'),

			minLength : 1,
			matchFromStart : false,

			callback : function(e) {

				var $a = $(e.currentTarget);
				$('#searchMovie').val($a.text());
				$('#searchMovie').autocomplete('clear');

				var tempGalaxy = [];

				isMovieSelected = true;

				var i = movieTitleOrig.indexOf($a.text());

				selectedMovies.push(i);

				for (var count = 0; count < ratings.length; count++) {

					if (ratings[count][i] >= PSmin && ratings[count][i] <= PSmax) {

						//console.log('The User ' + count +' gave ' + i + 'th  movie 5 star');

						tempGalaxy.push(count);

					}
				}

				userGalaxy.push(tempGalaxy);

				redraw();

			}
		});
	});
	
	$('#movieXAxisMenu').on('change', function() {
		
		var $this = $(this),
			val	= $this.val();
			
			switch (val) {
				case 'sim1':
					svgMovieGroup.selectAll(".selectedCircle, .star").transition()
						.duration(3000)
						.attr('cx', function (d) {
						return x(+d.X)
					});
					
					break;
				case 'avgReview':
					svgMovieGroup.selectAll(".selectedCircle, .star").transition()
						.duration(3000)
						.attr('cx', function (d) {
						return x(+d.avgReview)
					});
					break;
				case 'numReview':
					svgMovieGroup.selectAll(".selectedCircle, .star").transition()
						.duration(3000)
						.attr('cx', function (d) {
						return x(+d.numReview)
					});
					break;
				case 'relDate':
				
					var timeFormat = d3.time.format("%e-%b-%Y");
					
					var minDate = d3.min(movieData, function(d){ return timeFormat.parse(d.date); });
					var MaxDate = d3.max(movieData, function(d){ return timeFormat.parse(d.date); });
					
					var timeX = d3.time.scale().domain([minDate, MaxDate]).range([margin, w - margin]);
					
					xAxis.scale(timeX);
						//			.orient("bottom")
						//			.ticks(5);
					
					
					svgMovie.selectAll(".x.axis").transition()
							.duration(1000)
							.call(xAxis);
							
					zoomMovie.x(timeX);
					
					svgMovieGroup.selectAll(".selectedCircle, .star").transition()
						.duration(1000)
						.attr('cx', function (d) {
						return timeX((timeFormat.parse(d.date)));
					});
					break;
			}
	});
	
	$('#movieYAxisMenu').on('change', function() {
		
		var $this = $(this),
			val	= $this.val();
			
			switch (val) {
				case 'sim2':
				svgMovieGroup.selectAll(".selectedCircle, .star").transition()
							.duration(3000)
						.attr('cy', function (d) {
						return y(+d.Y)
					});
					break;
				case 'avgReview':
					svgMovieGroup.selectAll(".selectedCircle, .star").transition()
						.duration(3000)
						.attr('cy', function (d) {
						return y(+d.avgReview)
					});
					break;
				case 'numReview':
					svgMovieGroup.selectAll(".selectedCircle, .star").transition()
						.duration(3000)
						.attr('cy', function (d) {
						return y(+d.numReview)
					});
					break;
				case 'relDate':
				
					var timeFormat = d3.time.format("%e-%b-%y");
					
					var minDate = d3.min(movieData, function(d){ return timeFormat.parse(d.date); });
					var MaxDate = d3.max(movieData, function(d){ return timeFormat.parse(d.date); });
					
					var timeX = d3.time.scale().domain([minDate, MaxDate]).range([margin, w - margin]);
					
					
					svgMovieGroup.selectAll(".selectedCircle, .star").transition()
						.attr('cy', function (d) {
						return timeX((timeFormat.parse(d.date)));
					});
					break;
			}
	});
	
	

	

});

