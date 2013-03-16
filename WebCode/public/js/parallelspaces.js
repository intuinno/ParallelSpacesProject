$('#page1').live('pageinit', function() {

	var PSmin = 4, PSmax = 5;

	$("#range-1a").on("change", function(event) {

		PSmin = event.target.value;
	});

	$("#range-1b").on("change", function(event) {

		PSmax = event.target.value;
	});

	var w = 600;
	var h = 600;
	var margin = 20;
	var jobList = ['administrator',
    'artist',
    'doctor',
    'educator',
    'engineer',
    'entertainment',
    'executive',
    'healthcare',
    'homemaker',
    'lawyer',
    'librarian',
    'marketing',
    'none',
    'other',
    'programmer',
    'retired',
    'salesman',
    'scientist',
    'student',
    'technician',
    'writer'];

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
	var maxStarRadius = 10;
	var minStarRadius = 2;
	
	//Scale variable for movie space
	var xDomainExtent = [0,1];
	var yDomainExtent = [0,1];
	
	var xValue = function (d) {
		return x(+d.X);
	}
 
 	var yValue = function (d) {
		return y(+d.Y);
	}

	//variables for Geo mapping
	var proj = d3.geo.albersUsa();
	var path = d3.geo.path().projection(proj);


	//Scale variable for user space
	var xDomainExtentUser = [0,1];
	var yDomainExtentUser = [0,1];
	
	var xValueUser = function (d) {
		return xScaleUser(+d.X);
	}
 
 	var yValueUser = function (d) {
		return yScaleUser(+d.Y);
	}	

	var x = d3.scale.linear().range([margin, w - margin]);

	var y = d3.scale.linear().range([ h - margin, margin]);
	
	var rMovieScale = d3.scale.linear().range([minStarRadius, maxStarRadius]);
	var fillMovieScale = d3.scale.pow(4).range(["white", "darkblue"]);
	
	
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
						.attr("height", h)
						.attr("viewBox", "0 0 " + w + " " +h)
						.attr("title", "Movie Space")
						.style("border", "1px solid silver")
						.attr("transform", "translate(" + margin + "," + margin + ")")
					.append("svg:g");
						//.attr("transform", "translate(" + margin + "," + margin + ")");	
						
	var clip = svgMovie.append("defs")
						.append("svg:clipPath")
						.attr("id","movieClip")
						.append("svg:rect")
						.attr("id","clip-rect")
						.attr("x",margin)
						.attr("y",margin)
						.attr("width",w-2*margin)
						.attr("height",h-2*margin);
						
	var svgMovieBody = svgMovie.append("g")
							.attr("clip-path","url(#movieClip)")
						//	.attr("transform", "translate(" + margin + "," + margin + ")")
							.call(zoomMovie);
							
	var rect = svgMovieBody.append("svg:rect")
							.attr("width",w-margin)
							.attr("height",h-margin)
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

	d3.csv("data/movieSpaceNoNormal.csv", function(movieCSV) {

		movieData = movieCSV;
		
		//Set up Scales after reading data
		
		rMovieScale.domain(d3.extent(movieData, function(d){ return +d.numReview; }));
		fillMovieScale.domain(d3.extent(movieData, function(d){ return +d.avgReview; }));
		
		

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
					.attr("cx", xValue)
					.attr("cy", yValue)
					.attr("r", function(d) {
						return rMovieScale(+d.numReview);
					})
					.attr("fill", function(d) {
						return fillMovieScale(+d.avgReview);
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
							
							xScaleUser.domain(xDomainExtentUser);
							yScaleUser.domain(yDomainExtentUser);
			
							svgUserSelectionGroup.selectAll("." + tempClass)
										.data(tempGalaxy, function(d) {
											return +d.num;
										})
										.enter()
										.append("circle")
										.attr("cx", function(d) {
											return xValueUser(d);
										})
										.attr("cy", function(d) {
											return yValueUser(d);
										})
										.attr("r", function(d) {
											return rUserScale(+d.numReview);
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

	var xScaleUser = d3.scale.linear().range([margin, w-margin]);
	var yScaleUser = d3.scale.linear().range([h-margin,margin]);
	
	var rUserScale = d3.scale.linear().range([minStarRadius, maxStarRadius]);
	var fillUserScale = d3.scale.pow(4).range(["white", "darkblue"]);
	
	var xAxisUser = d3.svg.axis()
						.scale(xScaleUser)
						.orient("bottom")
						.ticks(5);
						
	var yAxisUser = d3.svg.axis()
						.scale(yScaleUser)
						.orient("left")
						.ticks(5);
						
	var zoomUser = d3.behavior.zoom()
						.x(xScaleUser)
						.y(yScaleUser)
						.on("zoom", zoomedUser);
						
	var svgUser = d3.select("#userCanvas")
					.append("svg")
						.attr("height", h)
						.attr("viewBox", "0 0 " + w + " " +h)
						.attr("title", "User Space")
						.style("border", "1px solid silver")
						.attr("transform", "translate(" + margin + "," + margin + ")")
					.append("svg:g");
					
	var clip = svgUser.append("defs")
						.append("svg:clipPath")
						.attr("id","userClip")
						.append("svg:rect")
						.attr("id","clip-rect")
						.attr("x",margin)
						.attr("y",margin)
						.attr("width",w-2*margin)
						.attr("height",h-2*margin);
						
	var svgUserBody = svgUser.append("g")
							.attr("clip-path","url(#userClip)")
							.call(zoomUser);
							
	var rect = svgUserBody.append("svg:rect")
							.attr("width",w-margin)
							.attr("height",h-margin)
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
	
	d3.csv("data/userSpaceNoNormal.csv", function(userCSV) {

		userData = userCSV;
		
		//Set up Scales after reading data
		
		rUserScale.domain(d3.extent(userData, function(d){ return +d.numReview; }));
		fillUserScale.domain(d3.extent(userData, function(d){ return +d.avgReview; }));
		

		svgUserGroup.selectAll("circle")
					.data(userCSV, function(d) {
						return +d.num;
					})
					.enter()
					.append("circle")
					.classed("userCircle", true)
					.classed("star", true)
					.attr("cx", xValueUser)
					.attr("cy", yValueUser)
					.attr("r", function(d) {
			//  console.log((d.numReview*5)*(d.numReview*10));
						return rUserScale(+d.numReview);

					})
					.attr("fill", function(d) {
							
						return fillUserScale(+d.avgReview);
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
			
							x.domain(xDomainExtent);
							y.domain(yDomainExtent);
							
							svgMovieSelectionGroup.selectAll("."+tempClass)
										.data(tempGalaxy, function(d) {
											return +d.index;
										})
										.enter()
										.append("circle")
										.attr("cx", function(d) {
											return xValue(d);
										})
										.attr("cy", function(d) {
											return yValue(d);
										})
										.attr("r", function(d) {
											return rMovieScale(+d.numReview);
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
				
					x = d3.scale.linear().range([margin, w - margin]);

					xDomainExtent = d3.extent(movieData, function(d){return +d.X;});
															
					xValue = function (d) {
						return x(+d.X);
					}
												
					break;
					
				case 'avgReview':
				
					x = d3.scale.linear().range([margin, w - margin]);

					xDomainExtent = d3.extent(movieData, function(d){return +d.avgReview;});
															
					xValue = function (d) {
						return x(+d.avgReview);
					}
										
					break;
					
				case 'numReview':
					
					x = d3.scale.linear().range([margin, w - margin]);
				
					xDomainExtent = d3.extent(movieData, function(d){return +d.numReview;});
															
					xValue = function (d) {
						return x(+d.numReview);
					}
										
					break;
															
				case 'relDate':
				
					var timeFormat = d3.time.format("%e-%b-%Y");
					
					xDomainExtent = d3.extent(movieData, function(d){ return timeFormat.parse(d.date); });
										
					x = d3.time.scale().range([margin, w - margin]);
					
					xValue = function (d) {
						return x((timeFormat.parse(d.date)));
					}
												
					break;
					
					
			}
			
			xAxis.scale(x);
		
			x.domain(xDomainExtent);
		
			y.domain(yDomainExtent);
			
			zoomMovie.x(x).y(y);
													
			svgMovieSelectionGroup.attr("transform", "scale(1)");
			
			svgMovieGroup.attr("transform", "scale(1)");

			svgMovie.selectAll(".y.axis").transition()
					.duration(1000)
					.call(yAxis);
			
			svgMovie.selectAll(".x.axis").transition()
					.duration(1000)
					.call(xAxis);
					
			svgMovieBody.selectAll(".selectedCircle, .star").transition()
				.duration(1000)
				.attr('cx', xValue)
				.attr("cy", yValue);		
					
	});
	
	$('#movieYAxisMenu').on('change', function() {
		
		var $this = $(this),
			val	= $this.val();
			
			switch (val) {
				case 'sim2':
				
					y = d3.scale.linear().range([ h - margin, margin]);

					yDomainExtent = d3.extent(movieData, function(d){return +d.Y;});
															
					yValue = function (d) {
						return y(+d.Y);
					}
												
					break;
					
				case 'avgReview':
				
					y = d3.scale.linear().range([ h - margin, margin]);

					yDomainExtent = d3.extent(movieData, function(d){return +d.avgReview;});
															
					yValue = function (d) {
						return y(+d.avgReview);
					}
										
					break;
					
				case 'numReview':
				
					y = d3.scale.linear().range([ h - margin, margin]);

					yDomainExtent = d3.extent(movieData, function(d){return +d.numReview;});
															
					yValue = function (d) {
						return y(+d.numReview);
					}
										
					break;
															
				case 'relDate':
				
					var timeFormat = d3.time.format("%e-%b-%Y");
					
					yDomainExtent = d3.extent(movieData, function(d){ return timeFormat.parse(d.date); });
										
					y = d3.time.scale().range([ h - margin, margin]);
					
					yValue = function (d) {
						return y((timeFormat.parse(d.date)));
					}
												
					break;
					
					
			}
			
			yAxis.scale(y);
		
			x.domain(xDomainExtent);
		
			y.domain(yDomainExtent);
			
			zoomMovie.x(x).y(y);
													
			svgMovieSelectionGroup.attr("transform", "scale(1)");
			
			svgMovieGroup.attr("transform", "scale(1)");

			svgMovie.selectAll(".y.axis").transition()
					.duration(1000)
					.call(yAxis);
			
			svgMovie.selectAll(".x.axis").transition()
					.duration(1000)
					.call(xAxis);
					
			svgMovieBody.selectAll(".selectedCircle, .star").transition()
				.duration(1000)
				.attr('cx', xValue)
				.attr("cy", yValue);		
	});
	
	$('#userXAxisMenu').on('change', function() {
		
		var $this = $(this),
			val	= $this.val();
			
			switch (val) {
				case 'sim1':
				
					xScaleUser = d3.scale.linear().range([margin, w - margin]);

					xDomainExtentUser = d3.extent(userData, function(d){return +d.X;});
															
					xValueUser = function (d) {
						return xScaleUser(+d.X);
					}
												
					break;
					
				case 'avgReview':
				
					xScaleUser = d3.scale.linear().range([margin, w - margin]);

					xDomainExtentUser = d3.extent(userData, function(d){return +d.avgReview;});
															
					xValueUser = function (d) {
						return xScaleUser(+d.avgReview);
					}
										
					break;
					
				case 'numReview':
					
					xScaleUser = d3.scale.linear().range([margin, w - margin]);

					xDomainExtentUser = d3.extent(userData, function(d){return +d.numReview;});
															
					xValueUser = function (d) {
						return xScaleUser(+d.numReview);
					}
										
					break;
															
				case 'age':
					
					xScaleUser = d3.scale.linear().range([margin, w - margin]);

					xDomainExtentUser = d3.extent(userData, function(d){return +d.age;});
															
					xValueUser = function (d) {
						return xScaleUser(+d.age);
					}
										
					break;
					
				case 'gender':
					
					xScaleUser = d3.scale.ordinal().rangePoints([margin, w - margin],1);

					xDomainExtentUser = ['M','F'];
															
					xValueUser = function (d) {
						return xScaleUser(d.sex);
					}
										
					break;
					
				case 'job':
					
					xScaleUser = d3.scale.ordinal().rangePoints([margin, w - margin],1);

					xDomainExtentUser = jobList;
															
					xValueUser = function (d) {
						return xScaleUser(d.job);
					}
										
					break;
					
				case 'location':
				
					queue()
    					.defer(d3.json, "data/us-states.geojson")
    					.defer(d3.tsv, "data/zips.tsv")
    					.await(render);
    					
															
					break;
					
			}
			
			xAxisUser.scale(xScaleUser);
		
			xScaleUser.domain(xDomainExtentUser);
		
			yScaleUser.domain(yDomainExtentUser);
			
			zoomUser.x(xScaleUser).y(yScaleUser);
													
			svgUserSelectionGroup.attr("transform", "scale(1)");
			
			svgUserGroup.attr("transform", "scale(1)");

			svgUser.selectAll(".y.axis").transition()
					.duration(1000)
					.call(yAxisUser);
			
			svgUser.selectAll(".x.axis").transition()
					.duration(1000)
					.call(xAxisUser);
					
			svgUserBody.selectAll(".selectedCircle, .star").transition()
				.duration(1000)
				.attr('cx', xValueUser)
				.attr("cy", yValueUser);		
					
	});

	function render(error, states, zips) {
		
		svgUserSelectionGroup.append("g").attr("id","states");
					
		d3.select("#states").selectAll("path")
				.data(states.features)
			.enter().append("path")
				.attr("d",path);
		var zipCode = "00210";
		zips.filter(function(d) {return d.zip == zipCode;});
		
		xValueUser = function (d) {
			
						var temp = zips.filter(function(el) {return el.zip == d.zip});
						var temp2 = [{lon:"43",lat:"-71"}];
						if (temp.length < 1) {
							temp = temp2;
						}
						var p = proj([temp[0].lon, temp[0].lat]);
						
						return p[0];
					}
					
		yValueUser = function (d) {
			var temp = zips.filter(function(el) {return el.zip == d.zip});
						
						var temp = zips.filter(function(el) {return el.zip == d.zip});
						var temp2 = [{lon:"43",lat:"-71"}];
						if (temp.length < 1) {
							temp = temp2;
						}
						var p = proj([temp[0].lon, temp[0].lat]);
						
						return p[1];
		}
										
							
					
		svgUserBody.selectAll(".selectedCircle, .star").transition()
				.duration(1000)
				.attr('cx', xValueUser)
				.attr("cy", yValueUser);	
		
						
				
		
				
	}

});

